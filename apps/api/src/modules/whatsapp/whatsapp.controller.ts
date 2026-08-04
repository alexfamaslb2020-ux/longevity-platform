import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { WhatsappService, WhatsAppWebhookPayload } from "./whatsapp.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { UserRole } from "@prisma/client";

@Controller("whatsapp")
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get("webhook")
  @Public()
  async verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    return this.whatsappService.handleWebhookVerify(mode, token, challenge);
  }

  @Post("webhook")
  @Public()
  async receiveMessage(@Body() payload: WhatsAppWebhookPayload) {
    await this.whatsappService.processIncomingMessage(payload);
    return { status: "ok" };
  }

  @Post("send")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async sendMessage(@Body() dto: { to: string; message: string }) {
    return this.whatsappService.sendText(dto.to, dto.message);
  }

  @Post("template")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async sendTemplate(
    @Body()
    dto: {
      to: string;
      template: string;
      parameters?: Record<string, string>[];
    },
  ) {
    return this.whatsappService.sendTemplate(
      dto.to,
      dto.template,
      dto.parameters,
    );
  }
}
