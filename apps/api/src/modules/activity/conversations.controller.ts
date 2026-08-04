import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("conversations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findAll(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("channel") channel?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = Math.min(limit ? parseInt(limit, 10) : 20, 100);

    const where: Record<string, any> = {
      OR: [
        { lead: { organizationId: user.organizationId } },
        { customer: { organizationId: user.organizationId } },
      ],
    };
    if (channel) where.channel = channel;
    if (search) {
      where.OR = [
        { lead: { name: { contains: search, mode: "insensitive" } } },
        { customer: { lead: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true, phone: true, email: true } },
          customer: {
            select: {
              id: true,
              lead: { select: { id: true, name: true, phone: true, email: true } },
            },
          },
          messages: { orderBy: { sentAt: "desc" }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  @Get(":id")
  @Roles(
    UserRole.ADMIN,
    UserRole.SALES,
    UserRole.MANAGER,
    UserRole.PROFESSIONAL,
  )
  async findById(@Param("id", ParseUUIDPipe) id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true } },
        customer: {
          select: {
            id: true,
            lead: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        messages: { orderBy: { sentAt: "asc" } },
      },
    });
    return conversation;
  }
}
