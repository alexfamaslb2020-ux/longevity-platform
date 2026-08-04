import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, AppointmentStatus } from "@prisma/client";
import { IsOptional, IsEnum, IsString, IsInt } from "class-validator";

class ListAppointmentsQuery {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
  @IsOptional()
  @IsString()
  from?: string;
  @IsOptional()
  @IsString()
  to?: string;
  @IsOptional()
  @IsInt()
  limit?: number;
}

@Controller("appointments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findAll(
    @CurrentUser() user: any,
    @Query() query: ListAppointmentsQuery,
  ) {
    return this.appointmentsService.findAll({
      organizationId: user.organizationId,
      status: query.status,
      from: query.from,
      to: query.to,
      limit: query.limit ? parseInt(String(query.limit), 10) : 200,
    });
  }
}
