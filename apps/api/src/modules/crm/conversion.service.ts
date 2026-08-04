import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { MultiTenantService } from "../../common/multi-tenant.service";
import { AuditService } from "../../common/audit.service";
import { AutomationService } from "../automation/automation.service";
import { AutomationEvent } from "../automation/events";

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenant: MultiTenantService,
    private readonly audit: AuditService,
    private readonly automation: AutomationService,
  ) {}

  async convert(params: {
    leadId: string;
    userId?: string;
    organizationId: string;
    responsibleUserId?: string;
    actorId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const { leadId, organizationId, userId, responsibleUserId, actorId } =
      params;

    // 1. Load and validate ownership
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        pipelineStage: { select: { id: true, name: true } },
      },
    });

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: "Lead não encontrado",
      });
    }

    this.multiTenant.validateOwnership(lead, organizationId, "Lead");

    // 2. Check already converted
    if (lead.status === "CONVERTED") {
      throw new BadRequestException({
        code: "ALREADY_CONVERTED",
        message: "Lead já foi convertido",
      });
    }

    // 3. Check for duplicates
    const duplicateWhere: Record<string, string>[] = [];
    if (lead.email) duplicateWhere.push({ email: lead.email });
    if (lead.phone) duplicateWhere.push({ phone: lead.phone });

    if (duplicateWhere.length > 0) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          lead: {
            OR: duplicateWhere,
            id: { not: leadId },
            status: "CONVERTED",
          },
        },
      });
      if (existingCustomer) {
        throw new ConflictException({
          code: "DUPLICATE_CUSTOMER",
          message: "Já existe um cliente com este email ou telefone",
        });
      }
    }

    // 4. Execute conversion in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          leadId,
          userId,
          organizationId,
          responsibleUserId: responsibleUserId || lead.assignedToId,
          status: "ONBOARDING" as any,
          metadata: (params.metadata || lead.metadata || {}) as any,
          tags: lead.tags,
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: { status: "CONVERTED" as any },
      });

      // Copy conversations to customer
      const conversations = await tx.conversation.findMany({
        where: { leadId },
      });
      for (const conv of conversations) {
        await tx.conversation.update({
          where: { id: conv.id },
          data: { customerId: customer.id },
        });
      }

      return customer;
    });

    // 5. Audit log
    await this.audit.log({
      userId: actorId,
      organizationId,
      action: "lead.converted",
      resource: "customer",
      resourceId: result.id,
      details: {
        leadId,
        leadName: lead.name,
        leadEmail: lead.email,
        leadStatus: lead.status,
        responsibleUserId,
      },
    });

    this.logger.log(
      `Lead ${lead.name} (${leadId}) converted to customer ${result.id}`,
    );

    await this.automation.publish(AutomationEvent.LEAD_CONVERTED, {
      entityId: result.id,
      entityType: "customer",
      organizationId,
      data: {
        leadId,
        customerId: result.id,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
      },
    });

    // 6. Return with lead data
    return {
      ...result,
      lead,
    };
  }
}
