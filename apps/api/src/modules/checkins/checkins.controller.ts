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
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole, CheckInChannel } from "@prisma/client";

@Controller("checkins")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROFESSIONAL)
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.checkinsService.findAll({
      organizationId: user.organizationId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status: status as any,
      type,
      customerId,
    });
  }

  @Get("me")
  @Roles(UserRole.CLIENT)
  async findMine(@CurrentUser() user: any) {
    return this.checkinsService.findByUser(user.sub);
  }

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
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
    UserRole.CLIENT,
  )
  async complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { responses: Record<string, number | string | boolean> },
    @CurrentUser() user: any,
  ) {
    return this.checkinsService.complete(id, dto.responses, user);
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
