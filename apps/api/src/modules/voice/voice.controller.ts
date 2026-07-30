import { Controller, Post, Body, Get, UseGuards, Param } from "@nestjs/common";
import { VoiceService } from "./voice.service";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { UserRole } from "@prisma/client";

@Controller("voice")
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly promptService: PromptService,
  ) {}

  @Post("call")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.MANAGER)
  async makeCall(
    @Body()
    dto: {
      to: string;
      promptCategory: string;
      context?: Record<string, unknown>;
    },
  ) {
    return this.voiceService.makeCall(dto.to, dto.promptCategory, dto.context);
  }

  @Post("webhook")
  @Public()
  async handleWebhook(@Body() payload: any) {
    return this.voiceService.handleWebhook(payload);
  }

  @Get("prompts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getPromptCategories() {
    return { categories: this.promptService.getCategories() };
  }

  @Get("prompts/:category")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getPrompt(@Param("category") category: string) {
    return this.promptService.getPrompt(category.toUpperCase());
  }
}
