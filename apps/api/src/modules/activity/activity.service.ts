import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addNote(params: {
    relatedTo: "lead" | "customer";
    relatedId: string;
    content: string;
    authorId: string;
  }) {
    const note = await this.prisma.note.create({
      data: {
        relatedTo: params.relatedTo,
        relatedId: params.relatedId,
        content: params.content,
        authorId: params.authorId,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    this.logger.log(`Note added to ${params.relatedTo} ${params.relatedId}`);
    return note;
  }

  async findNotes(params: {
    relatedTo?: "lead" | "customer";
    relatedId?: string;
  }) {
    return this.prisma.note.findMany({
      where: {
        relatedTo: params.relatedTo,
        relatedId: params.relatedId,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getLeadHistory(leadId: string) {
    const [auditLogs, notes, conversations, appointments] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { resourceId: leadId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.note.findMany({
        where: { relatedTo: "lead", relatedId: leadId },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.conversation.findMany({
        where: { leadId },
        include: {
          messages: { orderBy: { sentAt: "desc" }, take: 200 },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.appointment.findMany({
        where: { leadId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items: any[] = [];

    for (const a of auditLogs) {
      items.push({
        date: a.createdAt,
        type: "audit",
        title: this.describeAudit(a.action),
        description: a.details ? JSON.stringify(a.details) : "",
      });
    }
    for (const n of notes) {
      items.push({
        date: n.createdAt,
        type: "note",
        title: `Nota de ${n.author?.name || "utilizador"}`,
        description: n.content,
      });
    }
    for (const conv of conversations) {
      for (const m of conv.messages) {
        items.push({
          date: m.sentAt,
          type: "message",
          title: m.role === "AI" ? "IA — WhatsApp" : `Mensagem (${m.role})`,
          description: m.content,
        });
      }
    }
    for (const ap of appointments) {
      items.push({
        date: ap.createdAt,
        type: "appointment",
        title: `Agendamento: ${ap.title}`,
        description: `${ap.status} — ${ap.startDate ? new Date(ap.startDate).toLocaleString("pt-PT") : ""}`,
      });
    }

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return items;
  }

  async getCustomerHistory(customerId: string) {
    const [
      auditLogs,
      notes,
      conversations,
      appointments,
      checkIns,
      alerts,
      tasks,
      calls,
    ] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { resourceId: customerId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.note.findMany({
        where: { relatedTo: "customer", relatedId: customerId },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.conversation.findMany({
        where: { customerId },
        include: {
          messages: { orderBy: { sentAt: "desc" }, take: 200 },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.appointment.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.checkIn.findMany({
        where: { customerId },
        orderBy: { completedAt: "desc" },
        take: 100,
      }),
      this.prisma.alert.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.task.findMany({
        where: { relatedTo: "customer", relatedId: customerId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.call.findMany({
        where: { conversation: { customerId } },
        orderBy: { startedAt: "desc" },
        take: 100,
      }),
    ]);

    const items: any[] = [];

    for (const a of auditLogs) {
      items.push({
        date: a.createdAt,
        type: "audit",
        title: this.describeAudit(a.action),
        description: a.details ? JSON.stringify(a.details) : "",
      });
    }
    for (const n of notes) {
      items.push({
        date: n.createdAt,
        type: "note",
        title: `Nota de ${n.author?.name || "utilizador"}`,
        description: n.content,
      });
    }
    for (const conv of conversations) {
      for (const m of conv.messages) {
        items.push({
          date: m.sentAt,
          type: "message",
          title: m.role === "AI" ? "IA — WhatsApp" : `Mensagem (${m.role})`,
          description: m.content,
        });
      }
    }
    for (const ap of appointments) {
      items.push({
        date: ap.createdAt,
        type: "appointment",
        title: `Agendamento: ${ap.title}`,
        description: `${ap.status} — ${ap.startDate ? new Date(ap.startDate).toLocaleString("pt-PT") : ""}`,
      });
    }
    for (const ci of checkIns) {
      items.push({
        date: ci.completedAt || ci.scheduledAt,
        type: "checkin",
        title: `Check-in ${ci.type} (${ci.status})`,
        description: `Nível: ${ci.alertLevel} — ${ci.responses ? JSON.stringify(ci.responses) : ""}`,
      });
    }
    for (const al of alerts) {
      items.push({
        date: al.createdAt,
        type: "alert",
        title: `Alerta: ${al.title}`,
        description: `${al.level} — ${al.message}`,
      });
    }
    for (const t of tasks) {
      items.push({
        date: t.createdAt,
        type: "task",
        title: `Tarefa: ${t.title}`,
        description: `${t.status}${t.completedAt ? ` — concluída ${new Date(t.completedAt).toLocaleString("pt-PT")}` : ""}`,
      });
    }
    for (const c of calls) {
      items.push({
        date: c.startedAt || c.createdAt,
        type: "call",
        title: `Chamada IA (${c.direction})`,
        description: `${c.status} — ${c.summary || ""}${c.duration ? ` (${Math.round(c.duration / 60)}m ${c.duration % 60}s)` : ""}`,
      });
    }

    items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return items;
  }

  private describeAudit(action: string): string {
    const map: Record<string, string> = {
      "lead.converted": "Conversão em cliente",
      "demo.capture": "Captação de lead (formulário do site)",
      "demo.qualify": "Qualificação automática",
      "demo.whatsapp": "Conversa WhatsApp simulada",
      "demo.voice": "Chamada com IA de voz",
      "demo.appointment": "Agendamento criado",
      "demo.pipeline": "Movimento no pipeline",
      "demo.onboarding": "Onboarding concluído",
      "demo.checkin": "Check-in respondido",
      "demo.risk": "Deteção de risco",
      "demo.alert": "Alerta e tarefa criados",
      "demo.followup": "Acompanhamento contínuo",
      "demo.portal": "Portal do cliente ativado",
      "demo.history": "Histórico registado",
    };
    return map[action] || `Evento: ${action}`;
  }
}
