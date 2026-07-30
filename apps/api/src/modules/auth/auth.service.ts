import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    organizationId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException({
        code: "EMAIL_EXISTS",
        message: "Email já registado",
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role || UserRole.CLIENT,
        organizationId: data.organizationId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.email} (${user.id})`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        active: true,
        mfaEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email ou password inválidos",
      });
    }

    if (!user.active) {
      throw new UnauthorizedException({
        code: "ACCOUNT_INACTIVE",
        message: "Conta desativada",
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email ou password inválidos",
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`User logged in: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
      ...tokens,
      requiresMfa: user.mfaEnabled,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("app.jwtSecret"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, active: true },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException({
          code: "INVALID_TOKEN",
          message: "Token inválido",
        });
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_TOKEN",
        message: "Token inválido ou expirado",
      });
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, active: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: { select: { resource: true, action: true } },
        organizationId: true,
      },
    });
  }

  async getPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { permissions: true },
    });

    if (!user) return [];

    const rolePermissions = this.getDefaultPermissions(user.role);
    const customPermissions = user.permissions.map(
      (p) => `${p.resource}:${p.action}`,
    );

    return [...new Set([...rolePermissions, ...customPermissions])];
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>("app.jwtRefreshExpiration"),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private getDefaultPermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.ADMIN]: ["*:*"],
      [UserRole.MANAGER]: [
        "leads:read",
        "leads:write",
        "leads:delete",
        "customers:read",
        "customers:write",
        "pipeline:read",
        "pipeline:write",
        "reports:read",
        "users:read",
        "settings:read",
        "settings:write",
      ],
      [UserRole.SALES]: [
        "leads:read",
        "leads:write",
        "customers:read",
        "pipeline:read",
        "pipeline:write",
        "tasks:read",
        "tasks:write",
        "conversations:read",
        "conversations:write",
      ],
      [UserRole.PROFESSIONAL]: [
        "customers:read",
        "customers:write",
        "checkins:read",
        "checkins:write",
        "tasks:read",
        "tasks:write",
        "conversations:read",
        "conversations:write",
        "reports:read",
      ],
      [UserRole.SUPPORT]: [
        "customers:read",
        "tasks:read",
        "tasks:write",
        "conversations:read",
        "conversations:write",
      ],
      [UserRole.CLIENT]: [
        "profile:read",
        "profile:write",
        "checkins:read",
        "checkins:write",
        "appointments:read",
        "documents:read",
        "conversations:read",
        "conversations:write",
      ],
      [UserRole.AUDITOR]: ["audit:read", "reports:read"],
    };

    return permissions[role] || [];
  }
}
