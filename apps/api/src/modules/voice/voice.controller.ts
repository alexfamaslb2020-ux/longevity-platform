import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { VoiceService, VoiceWebhookPayload } from "./voice.service";
import { PromptService } from "./prompt.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { UserRole, Prisma, CallStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";

@Controller("voice")
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly promptService: PromptService,
    private readonly prisma: PrismaService,
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
  async handleWebhook(@Body() payload: VoiceWebhookPayload) {
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

  @Get("calls")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async listCalls(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
  ) {
    const where: Prisma.CallWhereInput = {
      OR: [
        { conversation: { lead: { organizationId: user.organizationId } } },
        {
          conversation: { customer: { organizationId: user.organizationId } },
        },
      ],
    };
    if (status) where.status = status as CallStatus;

    return this.prisma.call.findMany({
      where,
      include: {
        conversation: {
          select: {
            id: true,
            lead: { select: { id: true, name: true, phone: true } },
            customer: {
              select: {
                id: true,
                lead: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      take: limit ? Math.min(parseInt(limit, 10), 200) : 100,
    });
  }

  @Get("calls/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async getCall(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.call.findUnique({
      where: { id },
      include: {
        conversation: {
          select: {
            id: true,
            summary: true,
            lead: { select: { id: true, name: true, phone: true } },
            customer: {
              select: {
                id: true,
                lead: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
      },
    });
  }
}
