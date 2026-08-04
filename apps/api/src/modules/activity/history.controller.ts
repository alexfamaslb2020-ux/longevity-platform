import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ActivityService } from "./activity.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("history")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistoryController {
  constructor(private readonly activityService: ActivityService) {}

  @Get("lead/:id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async leadHistory(@Param("id") id: string) {
    return this.activityService.getLeadHistory(id);
  }

  @Get("customer/:id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async customerHistory(@Param("id") id: string) {
    return this.activityService.getCustomerHistory(id);
  }
}
