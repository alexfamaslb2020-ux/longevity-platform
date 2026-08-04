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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, TaskStatus } from "@prisma/client";

@Controller("tasks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findAll(
    @CurrentUser() user: any,
    @Query("status") status?: TaskStatus,
    @Query("relatedTo") relatedTo?: string,
    @Query("relatedId") relatedId?: string,
    @Query("assignedTo") assignedToId?: string,
    @Query("limit") limit?: string,
  ) {
    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (relatedTo) where.relatedTo = relatedTo;
    if (relatedId) where.relatedId = relatedId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (user.organizationId) {
      where.OR = [
        { relatedTo: "lead", relatedId: null },
        { relatedTo: "customer", relatedId: null },
        {
          relatedTo: "lead",
          relatedId: { in: await this.leadIds(user.organizationId) },
        },
        {
          relatedTo: "customer",
          relatedId: { in: await this.customerIds(user.organizationId) },
        },
      ];
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: limit ? Math.min(parseInt(limit, 10), 200) : 100,
    });
  }

  @Patch(":id/complete")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async complete(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
    });
  }

  private async leadIds(organizationId: string): Promise<string[]> {
    const rows = await this.prisma.lead.findMany({
      where: { organizationId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  private async customerIds(organizationId: string): Promise<string[]> {
    const rows = await this.prisma.customer.findMany({
      where: { organizationId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
