import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma.service";
import { AuditService } from "../../common/audit.service";
import { LeadsService } from "../crm/leads.service";
import { CustomersService } from "../crm/customers.service";
import { ConversionService } from "../crm/conversion.service";
import { CheckinsService } from "../checkins/checkins.service";
import { WhatsappService } from "../whatsapp/whatsapp.service";
import { VoiceService } from "../voice/voice.service";
import {
  LeadSource,
  MessageRole,
  ConversationChannel,
  AppointmentStatus,
  CheckInChannel,
  CheckInStatus,
  CustomerStatus,
  TaskStatus,
  TaskPriority,
  AlertLevel,
  CallStatus,
} from "@prisma/client";

export interface DemoStepReport {
  id: string;
  title: string;
  status: "pending" | "ok" | "error" | "skipped";
  details?: string;
}

const DEMO_LEAD_NAME = "Cliente Demonstração";
const DEMO_EMAIL = "demo.cliente@longevity.local";
const DEMO_PHONE = "+351960001234";

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly audit: AuditService,
    private readonly leadsService: LeadsService,
    private readonly customersService: CustomersService,
    private readonly conversionService: ConversionService,
    private readonly checkinsService: CheckinsService,
    private readonly whatsappService: WhatsappService,
    private readonly voiceService: VoiceService,
  ) {}

  getFeatures() {
    const demo = this.configService.get("demo");
    return {
      demoMode: demo?.mode === true,
      features: demo?.features || {},
      providers: demo?.providers || {},
    };
  }

  async getStatus(organizationId: string) {
    const demoLead = await this.prisma.lead.findFirst({
      where: { organizationId, metadata: { path: ["demo"], equals: true } },
      include: { customer: { include: { _count: { select: { checkIns: true, alerts: true } } } } },
    });

    const NO_ID = "00000000-0000-0000-0000-000000000000";
    const whereBase = demoLead ? { OR: [{ id: demoLead.id }] } : { id: NO_ID };

    const [conversations, calls, appointments, checkins, alerts, tasks] =
      await Promise.all([
        this.prisma.conversation.count({
          where: { leadId: demoLead?.id || NO_ID },
        }),
        this.prisma.call.count({
          where: demoLead?.customer
            ? { conversation: { customerId: demoLead.customer.id } }
            : { conversation: { leadId: demoLead?.id || NO_ID } },
        }),
        this.prisma.appointment.count({
          where: { OR: [{ leadId: demoLead?.id }, { customerId: demoLead?.customer?.id }] },
        }),
        this.prisma.checkIn.count({
          where: { customerId: demoLead?.customer?.id || NO_ID },
        }),
        this.prisma.alert.count({
          where: { customerId: demoLead?.customer?.id || NO_ID },
        }),
        this.prisma.task.count({
          where: demoLead?.customer
            ? { OR: [{ relatedTo: "customer", relatedId: demoLead.customer.id }, { relatedTo: "lead", relatedId: demoLead.id }] }
            : { relatedTo: "lead", relatedId: demoLead?.id || NO_ID },
        }),
      ]);

    return {
      features: this.getFeatures(),
      lead: demoLead
        ? {
            id: demoLead.id,
            name: demoLead.name,
            status: demoLead.status,
            score: demoLead.score,
            pipelineStageId: demoLead.pipelineStageId,
          }
        : null,
      customer: demoLead?.customer
        ? {
            id: demoLead.customer.id,
            status: demoLead.customer.status,
            churnRisk: demoLead.customer.churnRisk,
          }
        : null,
      counts: { conversations, calls, appointments, checkins, alerts, tasks },
    };
  }

  async runJourney(userId: string, organizationId: string) {
    const steps: DemoStepReport[] = [];
    const push = (id: string, title: string) => {
      const entry: DemoStepReport = { id, title, status: "pending" };
      steps.push(entry);
      return entry;
    };
    const done = (entry: DemoStepReport, details?: string) => {
      entry.status = "ok";
      if (details) entry.details = details;
    };

    const now = Date.now();
    const t = (offsetMin: number) => new Date(now - offsetMin * 60000);

    try {
      // ---------- 1. Captação ----------
      const step1 = push("capture", "Captação do lead");
      const existing = await this.prisma.lead.findFirst({
        where: { organizationId, metadata: { path: ["demo"], equals: true } },
        include: { customer: true },
      });
      const lead =
        existing ||
        (await this.leadsService.create({
          name: DEMO_LEAD_NAME,
          email: DEMO_EMAIL,
          phone: DEMO_PHONE,
          source: LeadSource.WEBSITE,
          organizationId,
          metadata: { demo: true, demoStep: "captured" } as any,
        }));
      if (existing) {
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: { metadata: { demo: true, demoStep: "captured" } as any },
        });
      }
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.capture",
        resource: "lead",
        resourceId: lead.id,
        details: { demo: true, source: "website", step: "captura" },
      });
      done(step1, `${lead.name} criado pelo formulário do site`);

      // ---------- 2. Qualificação ----------
      const step2 = push("qualify", "Qualificação automática");
      const qualifyStage = await this.prisma.pipelineStage.findFirst({
        where: { pipeline: { organizationId }, key: "QUALIFYING" },
      });
      await this.leadsService.update(lead.id, {
        score: 85,
        ...(qualifyStage && { pipelineStageId: qualifyStage.id }),
        organizationId,
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.qualify",
        resource: "lead",
        resourceId: lead.id,
        details: { demo: true, score: 85, step: "qualificacao" },
      });
      done(step2, "Score 85 — perfil compatível com programa Premium");

      // ---------- 3. Conversa WhatsApp simulada ----------
      const step3 = push("whatsapp", "Conversa WhatsApp simulada");
      const convScript: Array<[string, string]> = [
        ["Olá! Vi o programa de longevidade no site. Como funciona?", "Obrigada pelo seu interesse! O programa combina avaliação, acompanhamento contínuo e planos personalizados. Posso dar mais detalhes."],
        ["Quanto custa e como é o acompanhamento?", "O Acompanhamento Básico é 49,90 €/mês e o Premium 99,90 €/mês. Ambos incluem check-ins semanais e o Premium tem chamadas de voz com a nossa assistente Sofia."],
        ["Pode agendar uma avaliação para mim?", "Com certeza! Posso marcar uma avaliação inicial de 30 minutos. Que dia prefere?"],
      ];
      for (let i = 0; i < convScript.length; i++) {
        const [userText, aiText] = convScript[i];
        await this.simulateWhatsappReply(DEMO_PHONE, userText, t(11 - i * 2));
        const conversation = await this.findConversationByPhone(DEMO_PHONE);
        await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            content: aiText,
            role: MessageRole.AI,
            contentType: "text",
            sentAt: t(11 - i * 2 + 0.1),
            metadata: { demo: true, simulated: true } as any,
          },
        });
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { summary: "Interesse no programa — pedido de avaliação inicial" },
        });
      }
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.whatsapp",
        resource: "lead",
        resourceId: lead.id,
        details: { demo: true, messages: convScript.length, step: "whatsapp" },
      });
      done(step3, `${convScript.length} trocas de mensagens com resposta automática`);

      // ---------- 4. Chamada com IA de voz ----------
      const step4 = push("voice", "Chamada com IA de voz");
      const call = await this.voiceService.makeCall(
        DEMO_PHONE,
        "QUALIFICATION",
        { leadId: lead.id, demo: true } as any,
      );
      await this.voiceService.handleWebhook({ callId: call.callSid });
      await this.prisma.call.update({
        where: { id: call.id },
        data: {
          status: CallStatus.COMPLETED,
          duration: 186,
          summary:
            "Chamada concluída: cliente demonstrou interesse no plano Premium e aceitou agendar avaliação inicial.",
          metadata: {
            promptCategory: "QUALIFICATION",
            demo: true,
            transcript: [
              "Sofia (IA): Olá! Falo da Longevidade. Posso falar consigo sobre o nosso programa?",
              "Cliente: Sim, gostava de perceber como funciona.",
              "Sofia (IA): O programa começa com uma avaliação inicial e depois acompanhamos a sua evolução com check-ins regulares.",
              "Cliente: Parece interessante. Quanto tempo dura a avaliação?",
              "Sofia (IA): A avaliação inicial demora cerca de 30 minutos. Posso agendar para si.",
              "Cliente: Sim, agende para esta semana se possível.",
            ] as any,
          } as any,
          endedAt: t(8.5),
        },
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.voice",
        resource: "lead",
        resourceId: lead.id,
        details: { demo: true, callId: call.id, duration: 186, step: "chamada_ia" },
      });
      done(step4, "Chamada com assistente Sofia (IA) — 3m06s, com transcrição");

      // ---------- 5. Agendamento ----------
      const step5 = push("appointment", "Agendamento");
      const appointment = await this.prisma.appointment.create({
        data: {
          leadId: lead.id,
          title: "Avaliação Inicial",
          type: "EVALUATION",
          status: AppointmentStatus.SCHEDULED,
          startDate: t(-2 * 24 * 60), // +2 days
          duration: 30,
          meetLink: "https://meet.longevity.local/demo",
          metadata: { demo: true } as any,
        },
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.appointment",
        resource: "lead",
        resourceId: lead.id,
        details: { demo: true, appointmentId: appointment.id, step: "agendamento" },
      });
      done(step5, "Avaliação Inicial agendada para 30 minutos");

      // ---------- 6. Movimento no pipeline ----------
      const step6 = push("pipeline", "Movimento no pipeline");
      const stageKeys = ["EVALUATION_SCHEDULED", "PROPOSAL_SENT", "DECISION"];
      const stages = await this.prisma.pipelineStage.findMany({
        where: { pipeline: { organizationId }, key: { in: stageKeys } },
      });
      const stageByKey = Object.fromEntries(stages.map((s) => [s.key, s.id]));
      for (const key of ["EVALUATION_SCHEDULED", "PROPOSAL_SENT"]) {
        if (stageByKey[key]) {
          await this.leadsService.update(lead.id, {
            pipelineStageId: stageByKey[key],
            organizationId,
          });
        }
      }
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.pipeline",
        resource: "lead",
        resourceId: lead.id,
        details: { demo: true, stages: stageKeys, step: "pipeline" },
      });
      done(step6, "Avaliação realizada → Proposta enviada → Decisão");

      // ---------- 7. Conversão ----------
      const step7 = push("convert", "Conversão em cliente");
      let customer = existing?.customer;
      if (!customer) {
        const salesUser = await this.prisma.user.findFirst({
          where: { organizationId, role: "SALES" as any },
          select: { id: true },
        });
        const converted = await this.conversionService.convert({
          leadId: lead.id,
          organizationId,
          responsibleUserId: salesUser?.id,
          actorId: userId,
          metadata: { demo: true } as any,
        });
        customer = converted;
      }
      await this.prisma.appointment.updateMany({
        where: { leadId: lead.id, customerId: null },
        data: { customerId: customer.id },
      });
      done(step7, `Cliente ${lead.name} criado (ONBOARDING)`);

      // ---------- 8. Onboarding ----------
      const step8 = push("onboarding", "Onboarding");
      await this.customersService.update(customer.id, {
        status: CustomerStatus.ACTIVE,
        internalNotes:
          "Onboarding concluído: plano Premium, documentação assinada, primeira avaliação feita.",
        organizationId,
      });
      const premiumService = await this.prisma.service.findFirst({
        where: { organizationId, name: { contains: "Premium", mode: "insensitive" } },
        select: { id: true },
      });
      if (premiumService) {
        const existingSub = await this.prisma.subscription.findFirst({
          where: { customerId: customer.id, serviceId: premiumService.id },
        });
        if (!existingSub) {
          await this.prisma.subscription.create({
            data: {
              customerId: customer.id,
              serviceId: premiumService.id,
              status: "ACTIVE",
              startDate: t(5),
              renewalDate: new Date(now + 25 * 86400000),
              autoRenew: true,
            },
          });
        }
      }
      const onboardingTask = await this.prisma.task.findFirst({
        where: {
          OR: [
            { relatedTo: "lead", relatedId: lead.id },
            { relatedTo: "customer", relatedId: customer.id },
          ],
          title: { contains: "onboarding", mode: "insensitive" },
        },
      });
      if (onboardingTask) {
        await this.prisma.task.update({
          where: { id: onboardingTask.id },
          data: { status: TaskStatus.COMPLETED, completedAt: t(4.5) },
        });
      }
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { onboardingCompletedAt: t(4.5) },
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.onboarding",
        resource: "customer",
        resourceId: customer.id,
        details: { demo: true, step: "onboarding" },
      });
      done(step8, "Plano Premium ativado, tarefa de onboarding concluída");

      // ---------- 9. Check-in do cliente ----------
      const step9 = push("checkin", "Check-in do cliente");
      const checkin = await this.checkinsService.schedule({
        customerId: customer.id,
        type: "weekly",
        channel: CheckInChannel.APP,
        scheduledAt: t(3),
      });
      const result = await this.checkinsService.complete(checkin.id, {
        energy: 2,
        sleep: 3,
        stress: 4,
        mood: 2,
        adherence: 3,
        satisfaction: 2,
        difficulties: "Falta de energia e dificuldade em dormir",
        support_needed: true,
      });
      await this.prisma.checkIn.update({
        where: { id: checkin.id },
        data: { completedAt: t(3), sentAt: t(3.1) },
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.checkin",
        resource: "customer",
        resourceId: customer.id,
        details: { demo: true, alertLevel: result.alertLevel, step: "checkin" },
      });
      done(step9, `Check-in respondido — nível ${result.alertLevel}`);

      // ---------- 10. Deteção de risco ----------
      const step10 = push("risk", "Deteção de risco");
      const afterRisk = await this.prisma.customer.findUnique({
        where: { id: customer.id },
        select: { churnRisk: true },
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.risk",
        resource: "customer",
        resourceId: customer.id,
        details: {
          demo: true,
          churnRisk: afterRisk?.churnRisk,
          step: "deteccao_risco",
        },
      });
      done(
        step10,
        `Risco de churn ${Math.round((afterRisk?.churnRisk || 0) * 100)}% — detetado automaticamente`,
      );

      // ---------- 11. Alerta e tarefa ----------
      const step11 = push("alert-task", "Alerta e tarefa criados");
      const alertCount = await this.prisma.alert.count({
        where: { customerId: customer.id },
      });
      const taskCount = await this.prisma.task.count({
        where: {
          OR: [
            { relatedTo: "lead", relatedId: lead.id },
            { relatedTo: "customer", relatedId: customer.id },
          ],
        },
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.alert",
        resource: "customer",
        resourceId: customer.id,
        details: { demo: true, alerts: alertCount, tasks: taskCount, step: "alerta_tarefa" },
      });
      done(step11, `${alertCount} alerta(s) e ${taskCount} tarefa(s) no CRM`);

      // ---------- 12. Acompanhamento contínuo ----------
      const step12 = push("followup", "Acompanhamento contínuo");
      await this.whatsappService.sendText(
        DEMO_PHONE,
        "Olá! Vimos o seu check-in e a Dra. Ana já preparou algumas recomendações para melhorar a energia e o sono. Quer que agende uma conversa rápida?",
      );
      await this.simulateWhatsappReply(
        DEMO_PHONE,
        "Sim, pode ser. Obrigado pelo acompanhamento!",
        t(1.5),
      );
      await this.prisma.message.create({
        data: {
          conversationId: (await this.findConversationByPhone(DEMO_PHONE)).id,
          content:
            "Perfeito! Deixamos registado. Vai receber um convite para uma chamada de acompanhamento com a equipa. Até já!",
          role: MessageRole.AI,
          contentType: "text",
          sentAt: t(1.4),
          metadata: { demo: true, simulated: true } as any,
        },
      });
      const nextCheckin = await this.checkinsService.schedule({
        customerId: customer.id,
        type: "weekly",
        channel: CheckInChannel.WHATSAPP,
        scheduledAt: t(-7 * 24 * 60), // +7 days
      });
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.followup",
        resource: "customer",
        resourceId: customer.id,
        details: {
          demo: true,
          nextCheckin: nextCheckin.id,
          step: "acompanhamento",
        },
      });
      done(
        step12,
        "Recomendações enviadas e próximo check-in agendado (WhatsApp, +7 dias)",
      );

      // ---------- 13. Portal do cliente ----------
      const step13 = push("portal", "Ativação do portal do cliente");
      const clientUser = await this.prisma.user.findFirst({
        where: { organizationId, role: "CLIENT" as any },
        select: { id: true },
      });
      if (clientUser) {
        await this.prisma.customer.updateMany({
          where: { userId: clientUser.id },
          data: { userId: null },
        });
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { userId: clientUser.id },
        });
        await this.prisma.notification.create({
          data: {
            userId: clientUser.id,
            channel: "APP" as any,
            type: "PORTAL",
            title: "O seu portal está ativo",
            body: "Aceda ao portal para responder aos seus check-ins e acompanhar a sua evolução.",
            metadata: { demo: true } as any,
          },
        });
        await this.audit.log({
          userId,
          organizationId,
          action: "demo.portal",
          resource: "customer",
          resourceId: customer.id,
          details: { demo: true, userId: clientUser.id, step: "portal" },
        });
        done(step13, "Login: cliente@longevity.local (Maria Cliente)");
      } else {
        step13.status = "skipped";
        step13.details = "Sem utilizador CLIENT na organização";
      }

      // ---------- 14. Histórico completo ----------
      const step14 = push("history", "Histórico completo no CRM");
      await this.audit.log({
        userId,
        organizationId,
        action: "demo.history",
        resource: "customer",
        resourceId: customer.id,
        details: { demo: true, step: "historico", journeyComplete: true },
      });
      done(
        step14,
        "Conversas, chamada, check-ins, alertas e tarefas visíveis no CRM",
      );

      return {
        success: true,
        demoMode: true,
        leadId: lead.id,
        customerId: customer.id,
        conversationPhone: DEMO_PHONE,
        steps,
      };
    } catch (error: any) {
      this.logger.error(`Demo journey failed: ${error.message}`);
      const pending = steps.find((s) => s.status === "pending");
      if (pending) {
        pending.status = "error";
        pending.details = error.message;
      }
      return { success: false, steps };
    }
  }

  async simulateWhatsappReply(
    to: string,
    text?: string,
    at?: Date,
  ) {
    const content =
      text ||
      "Olá, só a responder para confirmar que recebi a vossa mensagem!";
    const contactName = DEMO_PHONE === to ? "Cliente Demonstração" : "Cliente";

    let conversation: { id: string; leadId: string | null } | null = null;
    try {
      conversation = await this.findConversationByPhone(to);
    } catch {
      conversation = null;
    }

    if (!conversation) {
      await this.whatsappService.processIncomingMessage({
        messages: [
          {
            from: to,
            id: `mock_msg_${Date.now()}`,
            type: "text",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: { body: content },
          },
        ],
        contacts: [{ wa_id: to, profile: { name: contactName } }],
      });
      conversation = await this.findConversationByPhone(to);
      return {
        status: "ok",
        message: content,
        leadCreated: true,
        conversationId: conversation.id,
      };
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        content,
        role: MessageRole.USER,
        contentType: "text",
        sentAt: at || new Date(),
        metadata: { demo: true, simulated: true, waMessageId: `mock_${Date.now()}` } as any,
      },
    });

    const lead = conversation.leadId
      ? await this.prisma.lead.findUnique({
          where: { id: conversation.leadId },
          select: { id: true },
        })
      : null;
    if (lead) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { lastContactedAt: at || new Date() },
      });
    }

    return {
      status: "ok",
      message: content,
      conversationId: conversation.id,
    };
  }

  async simulateVoiceCompletion(callId: string, duration?: number) {
    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    if (!call) {
      throw new NotFoundException({
        code: "CALL_NOT_FOUND",
        message: "Chamada não encontrada",
      });
    }

    await this.voiceService.handleWebhook({ callId: call.callSid });

    const category =
      ((call.metadata as any)?.promptCategory as string) || "QUALIFICATION";

    const transcripts: Record<string, string[]> = {
      QUALIFICATION: [
        "Sofia (IA): Olá! Falo da Longevidade. Posso falar consigo sobre o nosso programa?",
        "Cliente: Sim, gostava de perceber como funciona.",
        "Sofia (IA): O programa começa com uma avaliação inicial e depois acompanhamos a sua evolução com check-ins regulares.",
        "Cliente: Parece interessante. Quanto tempo dura a avaliação?",
        "Sofia (IA): A avaliação inicial demora cerca de 30 minutos. Posso agendar para si.",
        "Cliente: Sim, agende para esta semana se possível.",
      ],
      CHECK_IN: [
        "Sofia (IA): Olá! É só para fazer o seu check-in semanal. Como se sente esta semana?",
        "Cliente: Sinto-me cansado e a dormir pior.",
        "Sofia (IA): Lamento ouvir isso. Vou registar e a nossa equipa vai rever o seu plano. Obrigada!",
      ],
      SCHEDULING: [
        "Sofia (IA): Olá! Vim confirmar o agendamento da sua avaliação inicial.",
        "Cliente: Confirmado! Pode ser terça de manhã?",
        "Sofia (IA): Perfeito, fica agendado. Enviamos-lhe o link por mensagem.",
      ],
    };

    const summaryMap: Record<string, string> = {
      QUALIFICATION:
        "Chamada concluída: cliente demonstrou interesse no plano Premium e aceitou agendar avaliação inicial.",
      CHECK_IN:
        "Check-in por voz: cliente reportou fadiga e sono pior — encaminhado para a equipa clínica.",
      SCHEDULING:
        "Agendamento confirmado por voz — avaliação inicial marcada para terça de manhã.",
    };

    const transcript = transcripts[category] || transcripts.QUALIFICATION;

    const updated = await this.prisma.call.update({
      where: { id: call.id },
      data: {
        status: CallStatus.COMPLETED,
        duration: duration || 186,
        summary:
          summaryMap[category] ||
          "Chamada simulada concluída com sucesso.",
        metadata: {
          ...((call.metadata as any) || {}),
          demo: true,
          transcript,
        } as any,
        endedAt: new Date(),
      },
      include: {
        conversation: {
          include: {
            lead: { select: { id: true, name: true } },
            customer: { select: { id: true } },
          },
        },
      },
    });

    if (updated.conversationId) {
      const conversation = updated.conversation;
      const who =
        conversation?.customer?.id || conversation?.lead?.name || "Cliente";
      await this.prisma.message.create({
        data: {
          conversationId: updated.conversationId,
          content: `📞 Resumo da chamada IA: ${updated.summary}`,
          role: MessageRole.AI,
          contentType: "text",
          metadata: { demo: true, fromCall: call.id } as any,
        },
      });
      void who;
    }

    return updated;
  }

  async reset(organizationId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { organizationId, metadata: { path: ["demo"], equals: true } },
      select: { id: true },
    });
    const leadIds = leads.map((l) => l.id);

    const customers = await this.prisma.customer.findMany({
      where: { leadId: { in: leadIds } },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { leadId: { in: leadIds } },
          { customerId: { in: customerIds } },
        ],
      },
      select: { id: true },
    });
    const conversationIds = conversations.map((c) => c.id);

    const ids = [...leadIds, ...customerIds, ...conversationIds];

    const counters: Record<string, number> = {};
    const count = async (label: string, fn: () => Promise<{ count: number }>) => {
      const r = await fn();
      counters[label] = r.count;
    };

    await count("messages", () =>
      this.prisma.message.deleteMany({
        where: { conversationId: { in: conversationIds } },
      }),
    );
    await count("calls", () =>
      this.prisma.call.deleteMany({
        where: { conversationId: { in: conversationIds } },
      }),
    );
    await count("appointments", () =>
      this.prisma.appointment.deleteMany({
        where: {
          OR: [
            { leadId: { in: leadIds } },
            { customerId: { in: customerIds } },
          ],
        },
      }),
    );
    await count("checkins", () =>
      this.prisma.checkIn.deleteMany({
        where: { customerId: { in: customerIds } },
      }),
    );
    await count("alerts", () =>
      this.prisma.alert.deleteMany({
        where: { customerId: { in: customerIds } },
      }),
    );
    await count("tasks", () =>
      this.prisma.task.deleteMany({
        where: {
          OR: [
            { relatedTo: "lead", relatedId: { in: leadIds } },
            { relatedTo: "customer", relatedId: { in: customerIds } },
          ],
        },
      }),
    );
    await count("notes", () =>
      this.prisma.note.deleteMany({
        where: {
          OR: [
            { relatedTo: "lead", relatedId: { in: leadIds } },
            { relatedTo: "customer", relatedId: { in: customerIds } },
          ],
        },
      }),
    );
    await count("auditLogs", () =>
      this.prisma.auditLog.deleteMany({
        where: { resourceId: { in: ids } },
      }),
    );
    await count("workflowExecutions", () =>
      this.prisma.workflowExecution.deleteMany({
        where: { entityId: { in: ids } },
      }),
    );
    await count("notifications", () =>
      this.prisma.notification.deleteMany({
        where: { metadata: { path: ["demo"], equals: true } },
      }),
    );
    await count("subscriptions", () =>
      this.prisma.subscription.deleteMany({
        where: { customerId: { in: customerIds } },
      }),
    );
    await count("documents", () =>
      this.prisma.document.deleteMany({
        where: { customerId: { in: customerIds } },
      }),
    );
    await count("payments", () =>
      this.prisma.payment.deleteMany({
        where: { customerId: { in: customerIds } },
      }),
    );
    await count("conversations", () =>
      this.prisma.conversation.deleteMany({
        where: { id: { in: conversationIds } },
      }),
    );
    await count("customers", () =>
      this.prisma.customer.deleteMany({
        where: { id: { in: customerIds } },
      }),
    );
    await count("leads", () =>
      this.prisma.lead.deleteMany({ where: { id: { in: leadIds } } }),
    );

    return { success: true, deleted: counters };
  }

  private async findConversationByPhone(phone: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        channel: ConversationChannel.WHATSAPP,
        OR: [
          { lead: { phone } },
          { customer: { lead: { phone } } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    if (!conversation) {
      throw new BadRequestException({
        code: "CONVERSATION_NOT_FOUND",
        message: "Sem conversa WhatsApp para este telefone",
      });
    }
    return conversation;
  }
}
