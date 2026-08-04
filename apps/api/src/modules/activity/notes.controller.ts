import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ActivityService } from "./activity.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("notes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findAll(
    @Query("relatedTo") relatedTo?: "lead" | "customer",
    @Query("relatedId") relatedId?: string,
  ) {
    return this.activityService.findNotes({ relatedTo, relatedId });
  }

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async create(
    @Body()
    dto: { relatedTo: "lead" | "customer"; relatedId: string; content: string },
    @CurrentUser() user: any,
  ) {
    return this.activityService.addNote({
      relatedTo: dto.relatedTo,
      relatedId: dto.relatedId,
      content: dto.content,
      authorId: user.sub,
    });
  }
}
