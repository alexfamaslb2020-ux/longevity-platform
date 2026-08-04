import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, Prisma } from "@prisma/client";

@Controller("workflows")
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll() {
    const workflows = await this.prisma.workflow.findMany({
      orderBy: { priority: "asc" },
      include: {
        _count: { select: { executions: true } },
      },
    });
    return workflows;
  }

  @Get("executions")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async executions(
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    const where: Prisma.WorkflowExecutionWhereInput = {};
    if (status) where.status = status;
    return this.prisma.workflowExecution.findMany({
      where,
      include: {
        workflow: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: limit ? Math.min(parseInt(limit, 10), 100) : 50,
    });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        executions: { orderBy: { startedAt: "desc" }, take: 20 },
      },
    });
    return workflow;
  }
}
