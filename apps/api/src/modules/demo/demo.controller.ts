import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { DemoService } from "./demo.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("demo")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get("features")
  async getFeatures() {
    return this.demoService.getFeatures();
  }

  @Get("integrations")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async getIntegrations() {
    const features = this.demoService.getFeatures();
    const integrations = [
      {
        provider: "whatsapp",
        label: "WhatsApp Business",
        status: features.providers?.whatsapp || "mock",
        description:
          "Envio e receção de mensagens — atualmente em modo simulado.",
        mode: "mock",
      },
      {
        provider: "voice",
        label: "IA de Voz (Vapi)",
        status: features.providers?.voice || "mock",
        description:
          "Chamadas com assistente de IA — atualmente em modo simulado.",
        mode: "mock",
      },
      {
        provider: "messaging",
        label: "Mensagens",
        status: features.providers?.messaging || "mock",
        description: "Canais de mensagens — atualmente em modo simulado.",
        mode: "mock",
      },
      {
        provider: "payment",
        label: "Pagamentos (Stripe)",
        status: features.providers?.payment || "mock",
        description: "Cobranças e faturas — atualmente em modo simulado.",
        mode: "mock",
      },
    ];
    return {
      demoMode: features.demoMode,
      integrations,
    };
  }

  @Get("status")
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.PROFESSIONAL,
  )
  async getStatus(@CurrentUser() user: AuthUser) {
    return this.demoService.getStatus(user.organizationId!);
  }

  @Post("run")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async runJourney(@CurrentUser() user: AuthUser) {
    return this.demoService.runJourney(user.sub, user.organizationId!);
  }

  @Post("reset")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async reset(@CurrentUser() user: AuthUser) {
    return this.demoService.reset(user.organizationId!);
  }

  @Post("whatsapp/reply")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async simulateWhatsappReply(
    @Body() dto: { to: string; message?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.demoService.simulateWhatsappReply(
      dto.to,
      dto.message,
    );
    return {
      ...result,
      demoMode: true,
      simulated: true,
      organizationId: user.organizationId,
    };
  }

  @Post("voice/complete")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async simulateVoiceCompletion(
    @Body() dto: { callId: string; duration?: number },
  ) {
    return this.demoService.simulateVoiceCompletion(dto.callId, dto.duration);
  }
}
