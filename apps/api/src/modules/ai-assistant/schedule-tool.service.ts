import { Injectable, Logger } from "@nestjs/common";
import { AppointmentStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { AuditService } from "../../common/audit.service";
import type { SlotInfo } from "./ai-assistant.types";

export interface CheckSlotsParams {
  organizationId: string | null | undefined;
  date?: string; // YYYY-MM-DD
  durationMinutes?: number;
  daysAhead?: number;
}

export interface ScheduleAppointmentParams {
  organizationId: string | null | undefined;
  leadId: string;
  startIso: string;
  title?: string;
  type?: string;
  durationMinutes?: number;
  appointmentMetadata?: Record<string, unknown>;
  actorUserId?: string;
}

const OPEN_START_HOUR = 9; // 09:00
const OPEN_END_HOUR = 18; // 18:00 (último início 17:00)
export const SLOT_STEP_MINUTES = 30;

function dayLabel(date: Date): string {
  return date.toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tools do assistente: consulta de horários disponíveis e criação real de
 * Appointment no CRM (com audit log). Toda a lógica multi-tenant passa pelo
 * organizationId (via lead/customer).
 */
@Injectable()
export class ScheduleToolService {
  private readonly logger = new Logger(ScheduleToolService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async checkAvailableSlots(
    params: CheckSlotsParams,
  ): Promise<{ slots: SlotInfo[]; durationMinutes: number }> {
    const duration = params.durationMinutes ?? 30;
    const daysAhead = params.daysAhead ?? 7;
    const base = this.parseDateOnly(params.date) ?? new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < daysAhead; i++) {
      const day = new Date(base);
      day.setDate(day.getDate() + i);
      if (day.getDay() === 0) continue; // domingo fechado
      if (day < today) continue;
      dates.push(day);
    }

    if (dates.length === 0) {
      return { slots: [], durationMinutes: duration };
    }

    const windowStart = new Date(dates[0]);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(dates[dates.length - 1]);
    windowEnd.setHours(23, 59, 59, 999);

    const existing = await this.prisma.appointment.findMany({
      where: {
        startDate: { gte: windowStart, lte: windowEnd },
        OR: [
          { lead: { organizationId: params.organizationId } },
          { customer: { organizationId: params.organizationId } },
        ],
      },
      select: { startDate: true, duration: true },
    });
    const busy = existing.map((a) => ({
      start: new Date(a.startDate).getTime(),
      end: new Date(a.startDate).getTime() + (a.duration ?? 30) * 60000,
    }));

    const slots: SlotInfo[] = [];
    for (const day of dates) {
      const dayStart = new Date(day);
      dayStart.setHours(OPEN_START_HOUR, 0, 0, 0);
      const lastStart = new Date(day);
      lastStart.setHours(OPEN_END_HOUR - 1, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(OPEN_END_HOUR, 0, 0, 0);

      for (
        let cursor = dayStart;
        cursor <= lastStart;
        cursor = new Date(cursor.getTime() + SLOT_STEP_MINUTES * 60000)
      ) {
        const slotStart = cursor.getTime();
        const slotEnd = slotStart + duration * 60000;
        if (slotEnd > dayEnd.getTime()) break;
        const overlaps = busy.some(
          (b) => slotStart < b.end && b.start < slotEnd,
        );
        if (!overlaps) {
          slots.push({
            start: new Date(slotStart).toISOString(),
            label: `${dayLabel(day)} às ${timeLabel(new Date(slotStart))}`,
          });
        }
      }
    }

    return { slots, durationMinutes: duration };
  }

  async scheduleAppointment(params: ScheduleAppointmentParams): Promise<{
    appointment: {
      id: string;
      title: string;
      type: string;
      startDate: string;
      status: string;
      duration: number | null;
    };
    organizationId: string | null;
  }> {
    const startDate = new Date(params.startIso);
    const title = params.title ?? "Avaliação Inicial";
    const type = params.type ?? "EVALUATION";
    const duration = params.durationMinutes ?? 30;

    const lead = await this.prisma.lead.findUnique({
      where: { id: params.leadId },
      select: { organizationId: true, name: true },
    });
    if (!lead) {
      throw new Error("lead não encontrado — não é possível agendar");
    }
    const organizationId = params.organizationId ?? lead.organizationId ?? null;

    const appointment = await this.prisma.appointment.create({
      data: {
        leadId: params.leadId,
        title,
        type,
        status: AppointmentStatus.SCHEDULED,
        startDate,
        duration,
        metadata: {
          ...(params.appointmentMetadata ?? {}),
          createdByAssistant: true,
        },
      },
    });

    await this.audit.log({
      userId: params.actorUserId,
      organizationId: organizationId ?? undefined,
      action: "ai.appointment.created",
      resource: "appointment",
      resourceId: appointment.id,
      details: {
        leadId: params.leadId,
        leadName: lead.name,
        startDate: startDate.toISOString(),
        title,
        type,
        duration,
        assistant: true,
      },
    });

    return {
      appointment: {
        id: appointment.id,
        title: appointment.title,
        type: appointment.type,
        startDate: appointment.startDate.toISOString(),
        status: appointment.status,
        duration: appointment.duration,
      },
      organizationId,
    };
  }

  private parseDateOnly(value: string | undefined): Date | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, y, m, d] = match.map(Number);
    return new Date(y, m - 1, d);
  }
}
