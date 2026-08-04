import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ParseUUIDPipe } from "@nestjs/common";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findMine(@CurrentUser() user: any) {
    return this.prisma.notification.findMany({
      where: { userId: user.sub },
      orderBy: { sentAt: "desc" },
      take: 100,
    });
  }

  @Post(":id/read")
  async markRead(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
