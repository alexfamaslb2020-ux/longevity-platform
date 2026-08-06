import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { AiAssistantService } from "./ai-assistant.service";

@Controller("ai-assistant")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistant: AiAssistantService) {}

  @Get("status")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  status(@CurrentUser() user: AuthUser) {
    return this.aiAssistant.status(user.organizationId);
  }

  @Get("evaluations")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  evaluations(
    @CurrentUser() user: AuthUser,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.aiAssistant.listEvaluations(user.organizationId, limit ?? 20);
  }

  @Get("documents")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  documents(@CurrentUser() user: AuthUser) {
    return this.aiAssistant.listDocuments(user.organizationId);
  }

  @Post("documents")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  ingest(
    @Body() body: { title: string; category?: string; content: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiAssistant.ingestDocument(
      { title: body.title, category: body.category, content: body.content },
      user.organizationId,
      user.sub,
    );
  }

  @Delete("documents/:id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.aiAssistant.removeDocument(id, user.organizationId, user.sub);
  }

  @Post("demo/seed-documents")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(200)
  seedDemo(@CurrentUser() user: AuthUser) {
    return this.aiAssistant.seedDemoDocuments(user.organizationId);
  }

  @Post("chat")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  chat(
    @Body()
    body: {
      query: string;
      leadId?: string;
      phone?: string;
      conversationRef?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiAssistant.processQuery(
      {
        query: body.query,
        leadId: body.leadId,
        phone: body.phone,
        conversationRef: body.conversationRef,
      },
      user.organizationId,
      user.sub,
    );
  }

  @Post("tool-calls/:id/confirm")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  @HttpCode(200)
  confirmToolCall(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.aiAssistant.confirmToolCall(id, user.organizationId, user.sub);
  }

  @Post("tool-calls/:id/reject")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  @HttpCode(200)
  rejectToolCall(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.aiAssistant.rejectToolCall(id, user.organizationId);
  }
}
