import { Controller, Get, Logger, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Controller("health")
export class HealthController implements OnModuleDestroy {
  private readonly logger = new Logger(HealthController.name);
  private redis: Redis | null = null;
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => this.redis?.disconnect());
      this.redis = null;
    }
  }

  @Get()
  async check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get("live")
  async live() {
    return { status: "alive", timestamp: new Date().toISOString() };
  }

  @Get("ready")
  async ready() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "connected";
    } catch {
      checks.database = "disconnected";
      this.logger.error("Health check: database disconnected");
    }

    const redisUrl = this.configService.get<string>("redis.url");
    if (redisUrl) {
      try {
        if (!this.redis) {
          this.redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
            lazyConnect: true,
          });
        }
        await this.redis.ping();
        checks.redis = "connected";
      } catch {
        checks.redis = "disconnected";
        this.logger.error("Health check: redis disconnected");
      }
    } else {
      checks.redis = "not_configured";
    }

    const allOk = checks.database === "connected";

    return {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };
  }

  @Get("info")
  async info() {
    return {
      version: process.env.APP_VERSION || "0.1.0",
      commitSha: process.env.COMMIT_SHA || "unknown",
      environment: this.configService.get<string>("app.nodeEnv", "development"),
      startedAt: new Date(this.startTime).toISOString(),
      uptime: process.uptime(),
    };
  }
}
