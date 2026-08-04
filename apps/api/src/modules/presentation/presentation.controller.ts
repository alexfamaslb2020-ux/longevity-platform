import { Controller, Get, UseGuards } from "@nestjs/common";
import { PresentationService } from "./presentation.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("presentation")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PresentationController {
  constructor(private readonly presentationService: PresentationService) {}

  @Get("overview")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async getOverview(@CurrentUser() user: AuthUser) {
    return this.presentationService.getOverview(user.organizationId!);
  }

  @Get("health")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async getHealth() {
    return this.presentationService.getHealth();
  }
}
