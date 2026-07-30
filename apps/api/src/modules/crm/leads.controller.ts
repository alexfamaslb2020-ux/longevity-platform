import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { ConversionService } from "./conversion.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { UserRole, LeadStatus, LeadSource } from "@prisma/client";

@Controller("leads")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly conversionService: ConversionService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async create(@Body() dto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      source: dto.source || LeadSource.WEBSITE,
      assignedToId: dto.assignedToId,
      pipelineStageId: dto.pipelineStageId,
      organizationId: user.organizationId,
      metadata: dto.metadata,
    });
  }

  @Post("public")
  @Public()
  async createPublic(@Body() dto: CreateLeadDto) {
    return this.leadsService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      source: dto.source || LeadSource.WEBSITE,
      assignedToId: dto.assignedToId,
      pipelineStageId: dto.pipelineStageId,
      metadata: dto.metadata,
    });
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: LeadStatus,
    @Query("assignedTo") assignedToId?: string,
    @Query("stage") pipelineStageId?: string,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.leadsService.findAll({
      organizationId: user.organizationId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      assignedToId,
      pipelineStageId,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats(@CurrentUser() user: any) {
    return this.leadsService.getPipelineStats(user.organizationId);
  }

  @Get(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findById(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.findById(id, user.organizationId);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.update(id, {
      ...dto,
      organizationId: user.organizationId,
    });
  }

  @Post(":id/convert")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async convert(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.conversionService.convert({
      leadId: id,
      organizationId: user.organizationId,
      userId: dto.userId,
      responsibleUserId: dto.responsibleUserId,
      actorId: user.id,
      metadata: dto.metadata,
    });
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async delete(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    await this.leadsService.delete(id, user.organizationId);
    return { message: "Lead eliminado com sucesso" };
  }
}

class CreateLeadDto {
  name: string;
  email?: string;
  phone?: string;
  source?: any;
  assignedToId?: string;
  pipelineStageId?: string;
  metadata?: Record<string, unknown>;
}

class ConvertLeadDto {
  userId?: string;
  responsibleUserId?: string;
  metadata?: Record<string, unknown>;
}

class UpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  score?: number;
  assignedToId?: string;
  pipelineStageId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}
