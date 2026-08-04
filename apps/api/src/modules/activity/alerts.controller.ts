import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole, Prisma } from "@prisma/client";

@Controller("alerts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: "open" | "resolved",
    @Query("customerId") customerId?: string,
    @Query("limit") limit?: string,
  ) {
    const where: Prisma.AlertWhereInput = {};
    if (customerId) where.customerId = customerId;
    if (status === "open") where.resolvedAt = null;
    if (status === "resolved") where.resolvedAt = { not: null };
    if (user.organizationId) {
      where.customer = { organizationId: user.organizationId };
    }

    return this.prisma.alert.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            lead: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? Math.min(parseInt(limit, 10), 200) : 100,
    });
  }

  @Patch(":id/resolve")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.prisma.alert.update({
      where: { id },
      data: { resolvedAt: new Date(), resolvedById: user.sub },
    });
  }
}
