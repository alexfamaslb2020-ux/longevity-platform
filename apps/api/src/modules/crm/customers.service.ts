import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { MultiTenantService } from "../../common/multi-tenant.service";
import { CustomerStatus, LeadStatus, Prisma } from "@prisma/client";
import { AutomationService } from "../automation/automation.service";
import { AutomationEvent } from "../automation/events";

const customerInclude = {
  lead: {
    select: { id: true, name: true, email: true, phone: true, source: true },
  },
  user: { select: { id: true, email: true, name: true } },
  responsibleUser: { select: { id: true, name: true, email: true } },
  subscriptions: {
    include: { service: { select: { id: true, name: true } } },
  },
  _count: { select: { checkIns: true, appointments: true, alerts: true } },
};

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenant: MultiTenantService,
    private readonly automation: AutomationService,
  ) {}

  async create(data: {
    leadId: string;
    userId?: string;
    organizationId?: string;
    responsibleUserId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
    });
    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: "Lead não encontrado",
      });
    }

    await this.prisma.lead.update({
      where: { id: data.leadId },
      data: { status: LeadStatus.CONVERTED },
    });

    const customer = await this.prisma.customer.create({
      data: {
        leadId: data.leadId,
        userId: data.userId,
        organizationId: data.organizationId || lead.organizationId,
        responsibleUserId: data.responsibleUserId,
        status: CustomerStatus.ONBOARDING,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
      },
      include: customerInclude,
    });

    this.logger.log(
      `Customer created from lead: ${lead.name} (${customer.id})`,
    );
    return customer;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: CustomerStatus;
    responsibleUserId?: string;
    search?: string;
    churnRisk?: { gte?: number; lte?: number };
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    organizationId?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      status,
      responsibleUserId,
      search,
      churnRisk,
      sortBy = "createdAt",
      sortOrder = "desc",
      organizationId,
    } = params;

    const where: Prisma.CustomerWhereInput = {};
    where.organizationId = organizationId || undefined;

    if (status) where.status = status;
    if (responsibleUserId) where.responsibleUserId = responsibleUserId;
    if (churnRisk) {
      where.churnRisk = {};
      if (churnRisk.gte !== undefined) where.churnRisk.gte = churnRisk.gte;
      if (churnRisk.lte !== undefined) where.churnRisk.lte = churnRisk.lte;
    }
    if (search) {
      where.OR = [
        { lead: { name: { contains: search, mode: "insensitive" } } },
        { lead: { email: { contains: search, mode: "insensitive" } } },
        { lead: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: customerInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUserId(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      include: {
        ...customerInclude,
        conversations: {
          include: { messages: { take: 5, orderBy: { sentAt: "desc" } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        appointments: { orderBy: { startDate: "asc" } },
        checkIns: { orderBy: { scheduledAt: "desc" }, take: 20 },
        alerts: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    return customer;
  }

  async findById(id: string, organizationId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        ...customerInclude,
        conversations: {
          include: { messages: { take: 5, orderBy: { sentAt: "desc" } } },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        appointments: { orderBy: { startDate: "asc" } },
        checkIns: { orderBy: { scheduledAt: "desc" }, take: 10 },
        alerts: { orderBy: { createdAt: "desc" }, take: 10 },
        documents: { orderBy: { uploadedAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!customer) {
      throw new NotFoundException({
        code: "CUSTOMER_NOT_FOUND",
        message: "Cliente não encontrado",
      });
    }

    this.multiTenant.validateOwnership(customer, organizationId, "Customer");

    return customer;
  }

  async update(
    id: string,
    data: {
      status?: CustomerStatus;
      churnRisk?: number;
      responsibleUserId?: string;
      internalNotes?: string;
      metadata?: Record<string, unknown>;
      tags?: string[];
      organizationId?: string;
    },
  ) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException({
        code: "CUSTOMER_NOT_FOUND",
        message: "Cliente não encontrado",
      });
    }

    this.multiTenant.validateOwnership(
      customer,
      data.organizationId,
      "Customer",
    );

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.churnRisk !== undefined && {
          churnRisk: data.churnRisk,
          churnRiskUpdatedAt: new Date(),
        }),
        ...(data.responsibleUserId !== undefined && {
          responsibleUserId: data.responsibleUserId,
        }),
        ...(data.internalNotes !== undefined && {
          internalNotes: data.internalNotes,
        }),
        ...(data.metadata !== undefined && {
          metadata: data.metadata as Prisma.InputJsonValue,
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
      include: customerInclude,
    });

    this.logger.log(`Customer updated: ${updated.id}`);

    if (
      data.churnRisk !== undefined &&
      customer.churnRisk !== data.churnRisk &&
      data.organizationId
    ) {
      await this.automation.publish(AutomationEvent.CUSTOMER_RISK_CHANGED, {
        entityId: customer.id,
        entityType: "customer",
        organizationId: data.organizationId,
        data: {
          customerId: customer.id,
          previousRisk: customer.churnRisk,
          risk: data.churnRisk,
          customerName: customer.leadId ? undefined : customer.id,
        },
      });
    }

    return updated;
  }

  async getAtRiskCustomers(organizationId?: string) {
    const where: Prisma.CustomerWhereInput = {
      churnRisk: { gte: 0.5 },
      status: { not: CustomerStatus.CHURNED },
    };
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.customer.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, email: true, phone: true } },
        responsibleUser: { select: { id: true, name: true } },
        _count: { select: { alerts: { where: { resolvedAt: null } } } },
      },
      orderBy: { churnRisk: "desc" },
    });
  }
}
