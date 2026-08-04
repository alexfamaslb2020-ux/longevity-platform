import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PipelineService } from "./pipeline.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("pipeline")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body("name") name: string, @CurrentUser() user: AuthUser) {
    return this.pipelineService.create(name, user.organizationId);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async findAll(@CurrentUser() user: AuthUser) {
    return this.pipelineService.findAll(user.organizationId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.pipelineService.findById(id);
  }

  @Post(":id/stages")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addStage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { name: string; key: string; order: number; color: string },
  ) {
    return this.pipelineService.addStage(id, dto);
  }

  @Put("stages/:stageId")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateStage(
    @Param("stageId", ParseUUIDPipe) stageId: string,
    @Body() dto: { name?: string; color?: string; order?: number },
  ) {
    return this.pipelineService.updateStage(stageId, dto);
  }

  @Delete("stages/:stageId")
  @Roles(UserRole.ADMIN)
  async deleteStage(@Param("stageId", ParseUUIDPipe) stageId: string) {
    await this.pipelineService.deleteStage(stageId);
    return { message: "Etapa eliminada com sucesso" };
  }

  @Post("move/:leadId/:stageId")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async moveLead(
    @Param("leadId", ParseUUIDPipe) leadId: string,
    @Param("stageId", ParseUUIDPipe) stageId: string,
  ) {
    return this.pipelineService.moveLead(leadId, stageId);
  }
}
