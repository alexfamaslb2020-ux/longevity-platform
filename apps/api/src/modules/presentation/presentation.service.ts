import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { PrismaService } from "../../common/prisma.service";
import { DifyService } from "../dify/dify.service";

export interface PresentationAssumption {
  label: string;
  description: string;
}

@Injectable()
export class PresentationService {
  private readonly logger = new Logger(PresentationService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly difyService: DifyService,
  ) {}

  isEnabled(): boolean {
    const enabled = this.configService.get<boolean>("demo.presentationMode") === true;
    this.logger.debug(
      `presentationMode resolved=${enabled} raw=${process.env.DEMO_PRESENTATION_MODE} full=${JSON.stringify(this.configService.get("demo")?.presentationMode)}`,
    );
    return enabled;
  }

  private assertEnabled() {
    if (!this.isEnabled()) {
      throw new NotFoundException(
        "Modo de apresentação não está ativo (DEMO_PRESENTATION_MODE).",
      );
    }
  }

  private async getRedisClient(): Promise<Redis | null> {
    const url = this.configService.get<string>("redis.url");
    if (!url) return null;
    if (!this.redis) {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
      });
    }
    return this.redis;
  }

  async getOverview(organizationId: string) {
    this.assertEnabled();

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      org,
      leadsTotal,
      leadsActive,
      leadsLost,
      leadsConverted,
      leadsCold,
      customersActive,
      customersAtRisk,
      customersChurned,
      checkinsTotal,
      checkinsPending,
      checkinsMonth,
      conversations,
      messages,
      alertsActive,
      tasksPending,
      callsTotal,
      activeSubscriptions,
      services,
    ] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true, settings: true },
      }),
      this.prisma.lead.count({ where: { organizationId } }),
      this.prisma.lead.count({
        where: {
          organizationId,
          status: { notIn: ["CONVERTED", "LOST"] },
        },
      }),
      this.prisma.lead.count({
        where: { organizationId, status: "LOST" },
      }),
      this.prisma.lead.count({
        where: { organizationId, status: "CONVERTED" },
      }),
      this.prisma.lead.count({
        where: {
          organizationId,
          status: { notIn: ["CONVERTED", "LOST"] },
          OR: [{ lastContactedAt: { lt: sevenDaysAgo } }, { lastContactedAt: null }],
        },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      this.prisma.customer.count({
        where: { organizationId, churnRisk: { gte: 0.5 } },
      }),
      this.prisma.customer.count({
        where: { organizationId, status: "CHURNED" },
      }),
      this.prisma.checkIn.count({ where: { customer: { organizationId } } }),
      this.prisma.checkIn.count({
        where: {
          customer: { organizationId },
          status: { in: ["PENDING", "SENT", "OVERDUE"] },
        },
      }),
      this.prisma.checkIn.count({
        where: {
          customer: { organizationId },
          status: "COMPLETED",
          completedAt: { gte: monthStart },
        },
      }),
      this.prisma.conversation.count({ where: { lead: { organizationId } } }),
      this.prisma.message.count({
        where: { conversation: { lead: { organizationId } } },
      }),
      this.prisma.alert.count({ where: { customer: { organizationId } } }),
      this.prisma.task.count({ where: { status: "PENDING" } }),
      this.prisma.call.count({
        where: {
          OR: [
            { conversation: { lead: { organizationId } } },
            { conversation: { customer: { organizationId } } },
          ],
        },
      }),
      this.prisma.subscription.findMany({
        where: { status: "ACTIVE", customer: { organizationId } },
        include: { service: true },
      }),
      this.prisma.service.findMany({ where: { organizationId } }),
    ]);

    const mrr = activeSubscriptions.reduce(
      (sum, s) => sum + Number(s.service?.price || 0),
      0,
    );
    const avgTicket = activeSubscriptions.length
      ? Math.round((mrr / activeSubscriptions.length) * 100) / 100
      : services.length
        ? Math.round(
            (services.reduce((s, sv) => s + Number(sv.price || 0), 0) /
              services.length) *
              100,
          ) / 100
        : 0;

    const qualifiedLeads = leadsActive;
    const assumedConversionRate = 0.3;
    const potentialMonthly = Math.round(qualifiedLeads * avgTicket * assumedConversionRate);
    const atRiskMonthly = Math.round(customersAtRisk * avgTicket);
    const assumedMinutesPerManualCheckin = 8;
    const hoursSavedMonthly =
      Math.round((checkinsMonth * assumedMinutesPerManualCheckin * 10) / 60) / 10;

    const assumptions: PresentationAssumption[] = [
      {
        label: "Ticket médio mensal",
        description: `Média da carteira atual da demonstração (${activeSubscriptions.length} assinaturas ativas) — valor derivado dos dados da demo.`,
      },
      {
        label: "Taxa de conversão de 30%",
        description:
          "Pressuposto conservador usado apenas para ilustrar o potencial dos leads em pipeline. Não é uma projeção.",
      },
      {
        label: "8 minutos por check-in manual",
        description:
          "Pressuposto de tempo de equipa por check-in feito por telefone em vez de automático.",
      },
    ];

    return {
      mode: "presentation",
      organization: {
        name: org?.name || "Demo",
        settings: org?.settings || {},
      },
      counts: {
        leadsTotal,
        leadsActive,
        leadsLost,
        leadsConverted,
        leadsCold,
        customersActive,
        customersAtRisk,
        customersChurned,
        checkinsTotal,
        checkinsPending,
        checkinsMonth,
        conversations,
        messages,
        alertsActive,
        tasksPending,
        callsTotal,
        activeSubscriptions: activeSubscriptions.length,
      },
      value: {
        mrr,
        avgTicket,
        potentialMonthly,
        atRiskMonthly,
        hoursSavedMonthly,
        assumptions,
        disclaimer:
          "Valores estimados gerados a partir dos dados da demonstração. Não constituem projeções financeiras reais.",
      },
    };
  }

  async getHealth() {
    this.assertEnabled();

    const checks: Record<string, { status: string; detail?: string }> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok" };
    } catch {
      checks.database = { status: "error", detail: "PostgreSQL indisponível" };
    }

    const redis = await this.getRedisClient();
    if (redis) {
      try {
        await redis.ping();
        checks.redis = { status: "ok" };
      } catch {
        checks.redis = { status: "error", detail: "Redis indisponível" };
      }
    } else {
      checks.redis = { status: "not_configured" };
    }

    try {
      const keys = await redis?.keys("bull:*");
      const queueKeys = (keys ?? []).filter((k) => k.includes(":meta"));
      checks.queue = queueKeys.length
        ? { status: "ok", detail: `${queueKeys.length} fila(s) ativa(s)` }
        : { status: "warning", detail: "Sem filas registadas" };
    } catch {
      checks.queue = { status: "warning", detail: "Fila não verificável" };
    }

    try {
      const dify = await this.difyService.health();
      checks.ai = {
        status: dify.enabled ? "ok" : "warning",
        detail: dify.enabled ? "IA de chat disponível" : "IA não configurada",
      };
    } catch {
      checks.ai = { status: "warning", detail: "IA não verificável" };
    }

    const failed = Object.values(checks).filter((c) => c.status === "error");
    return {
      overall: failed.length ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
