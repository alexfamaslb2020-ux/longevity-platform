import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { MultiTenantService } from "../../common/multi-tenant.service";
import { LeadStatus, LeadSource, Prisma } from "@prisma/client";

const leadInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  pipelineStage: true,
  customer: { select: { id: true, status: true } },
  _count: { select: { conversations: true, appointments: true } },
};

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenant: MultiTenantService,
  ) {}

  async create(data: {
    name: string;
    email?: string;
    phone?: string;
    source: LeadSource;
    assignedToId?: string;
    pipelineStageId?: string;
    organizationId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const lead = await this.prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: data.source,
        status: LeadStatus.NEW,
        score: 0,
        assignedToId: data.assignedToId,
        pipelineStageId: data.pipelineStageId,
        organizationId: data.organizationId,
        metadata: (data.metadata as any) || {},
      },
      include: leadInclude,
    });

    this.logger.log(`Lead created: ${lead.name} (${lead.id})`);
    return lead;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: LeadStatus;
    assignedToId?: string;
    pipelineStageId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    organizationId?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      assignedToId,
      pipelineStageId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      organizationId,
    } = params;

    const where: Prisma.LeadWhereInput = {};
    where.organizationId = organizationId || undefined;

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (pipelineStageId) where.pipelineStageId = pipelineStageId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: leadInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, organizationId?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        ...leadInclude,
        conversations: {
          include: { messages: { take: 5, orderBy: { sentAt: "desc" } } },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        appointments: { orderBy: { startDate: "asc" } },
      },
    });

    this.multiTenant.validateOwnership(lead, organizationId, "Lead");

    return lead;
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      status?: LeadStatus;
      score?: number;
      assignedToId?: string;
      pipelineStageId?: string;
      metadata?: Record<string, unknown>;
      tags?: string[];
      organizationId?: string;
    },
  ) {
    const existing = await this.prisma.lead.findUnique({ where: { id } });
    this.multiTenant.validateOwnership(existing, data.organizationId, "Lead");

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.score !== undefined && { score: data.score }),
        ...(data.assignedToId !== undefined && {
          assignedToId: data.assignedToId,
        }),
        ...(data.pipelineStageId !== undefined && {
          pipelineStageId: data.pipelineStageId,
        }),
        ...(data.metadata !== undefined && { metadata: data.metadata as any }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
      include: leadInclude,
    });

    this.logger.log(`Lead updated: ${updated.name} (${updated.id})`);
    return updated;
  }

  async delete(id: string, organizationId?: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    this.multiTenant.validateOwnership(lead, organizationId, "Lead");

    await this.prisma.lead.delete({ where: { id } });

    if (lead) {
      this.logger.log(`Lead deleted: ${lead.name} (${id})`);
    }
  }

  async updateScore(id: string, score: number) {
    return this.prisma.lead.update({
      where: { id },
      data: { score },
      select: { id: true, name: true, score: true },
    });
  }

  async getPipelineStats(organizationId?: string) {
    const where: Prisma.LeadWhereInput = {};
    if (organizationId) where.organizationId = organizationId;

    const stages = await this.prisma.pipelineStage.findMany({
      where: organizationId ? { pipeline: { organizationId } } : {},
      include: {
        _count: { select: { leads: true } },
      },
      orderBy: { order: "asc" },
    });

    const statusCounts = await this.prisma.lead.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    return {
      stages: stages.map((s) => ({
        id: s.id,
        name: s.name,
        key: s.key,
        color: s.color,
        count: s._count.leads,
      })),
      statusCounts: statusCounts.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      total: stages.reduce((acc, s) => acc + s._count.leads, 0),
    };
  }
}
