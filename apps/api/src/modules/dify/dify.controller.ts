import { Controller, Get, Post, Body, UseGuards, Logger } from "@nestjs/common";
import { DifyService } from "./dify.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { ChatDto, WorkflowDto } from "./dto/dify.dto";

@Controller("dify")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DifyController {
  private readonly logger = new Logger(DifyController.name);

  constructor(private readonly difyService: DifyService) {}

  @Get("health")
  async health() {
    return this.difyService.health();
  }

  @Post("chat")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async chat(@Body() dto: ChatDto, @CurrentUser() user: any) {
    const result = await this.difyService.chatMessage({
      query: dto.query,
      conversation_id: dto.conversationId,
      inputs: dto.inputs,
      user: dto.inputs?.user
        ? String(dto.inputs.user)
        : user?.sub || "longevity-platform",
    });
    this.logger.log(
      `Dify chat answered (${result.message_id}) to user ${user?.sub}`,
    );
    return result;
  }

  @Post("workflow")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async runWorkflow(@Body() dto: WorkflowDto, @CurrentUser() user: any) {
    const result = await this.difyService.runWorkflow({
      inputs: dto.inputs,
      user: dto.user || user?.sub || "longevity-platform",
    });
    this.logger.log(
      `Dify workflow run finished (${result.workflow_run_id}) status=${result.data.status}`,
    );
    return result;
  }
}
