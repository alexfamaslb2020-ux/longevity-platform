import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { CheckinsService } from "./checkins.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { UserRole, CheckInChannel } from "@prisma/client";

@Controller("checkins")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async schedule(
    @Body()
    dto: {
      customerId: string;
      type: string;
      channel: CheckInChannel;
      scheduledAt: string;
    },
  ) {
    return this.checkinsService.schedule({
      customerId: dto.customerId,
      type: dto.type,
      channel: dto.channel,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Post(":id/complete")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { responses: Record<string, number | string | boolean> },
  ) {
    return this.checkinsService.complete(id, dto.responses);
  }

  @Post(":id/complete/public")
  @Public()
  async completePublic(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { responses: Record<string, number | string | boolean> },
  ) {
    return this.checkinsService.complete(id, dto.responses);
  }

  @Get("pending")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async getPending() {
    return this.checkinsService.findPending();
  }

  @Get("customer/:customerId")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
    UserRole.CLIENT,
  )
  async getByCustomer(
    @Param("customerId", ParseUUIDPipe) customerId: string,
    @Query("limit") limit?: string,
  ) {
    return this.checkinsService.findByCustomer(
      customerId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get("customer/:customerId/trends")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async getTrends(@Param("customerId", ParseUUIDPipe) customerId: string) {
    return this.checkinsService.getCustomerTrends(customerId);
  }
}
