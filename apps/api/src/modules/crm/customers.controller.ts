import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { CustomerStatus, UserRole } from "@prisma/client";

class CreateCustomerDto {
  leadId: string;
  userId?: string;
  responsibleUserId?: string;
  metadata?: Record<string, unknown>;
}

class UpdateCustomerDto {
  status?: CustomerStatus;
  churnRisk?: number;
  responsibleUserId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

@Controller("customers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.create({
      ...dto,
      organizationId: user.organizationId,
    });
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
    UserRole.SUPPORT,
  )
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: CustomerStatus,
    @Query("responsibleUser") responsibleUserId?: string,
    @Query("search") search?: string,
    @Query("churnRiskMin") churnRiskMin?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.customersService.findAll({
      organizationId: user.organizationId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      responsibleUserId,
      search,
      churnRisk: churnRiskMin ? { gte: parseFloat(churnRiskMin) } : undefined,
      sortBy,
      sortOrder,
    });
  }

  @Get("at-risk")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async getAtRisk(@CurrentUser() user: AuthUser) {
    return this.customersService.getAtRiskCustomers(user.organizationId);
  }

  @Get("me")
  @Roles(UserRole.CLIENT)
  async findMine(@CurrentUser() user: AuthUser) {
    const customer = await this.customersService.findByUserId(user.sub);
    return customer;
  }

  @Get(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
    UserRole.SUPPORT,
  )
  async findById(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.findById(id, user.organizationId);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.update(id, {
      ...dto,
      organizationId: user.organizationId,
    });
  }
}
