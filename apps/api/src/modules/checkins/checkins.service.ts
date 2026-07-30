import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import {
  CheckInStatus,
  CheckInChannel,
  AlertLevel,
  AlertType,
} from "@prisma/client";

export interface CheckInResult {
  id: string;
  customerId: string;
  status: CheckInStatus;
  alertLevel: AlertLevel;
  trend?: {
    direction: "improving" | "stable" | "declining";
    comparisons: Record<
      string,
      { previous: number; current: number; change: number }
    >;
  };
}

@Injectable()
export class CheckinsService {
  private readonly logger = new Logger(CheckinsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async schedule(data: {
    customerId: string;
    type: string;
    channel: CheckInChannel;
    scheduledAt: Date;
  }) {
    const checkIn = await this.prisma.checkIn.create({
      data: {
        customerId: data.customerId,
        type: data.type,
        channel: data.channel,
        status: CheckInStatus.PENDING,
        scheduledAt: data.scheduledAt,
        alertLevel: AlertLevel.NORMAL,
      },
      include: {
        customer: {
          select: {
            id: true,
            lead: { select: { name: true, phone: true, email: true } },
          },
        },
      },
    });

    this.logger.log(
      `Check-in scheduled: ${checkIn.id} for customer ${data.customerId}`,
    );
    return checkIn;
  }

  async complete(
    id: string,
    responses: Record<string, number | string | boolean>,
  ): Promise<CheckInResult> {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            checkIns: {
              where: { status: CheckInStatus.COMPLETED },
              orderBy: { completedAt: "desc" },
              take: 3,
            },
          },
        },
      },
    });

    if (!checkIn) {
      throw new NotFoundException({
        code: "CHECKIN_NOT_FOUND",
        message: "Check-in não encontrado",
      });
    }

    const alertLevel = this.calculateAlertLevel(responses);
    const trend = this.calculateTrend(responses, checkIn.customer.checkIns);
    const churnRisk = this.calculateChurnRisk(alertLevel, trend);

    const updated = await this.prisma.checkIn.update({
      where: { id },
      data: {
        status: CheckInStatus.COMPLETED,
        completedAt: new Date(),
        responses: responses as any,
        alertLevel,
      },
    });

    // Update customer
    await this.prisma.customer.update({
      where: { id: checkIn.customerId },
      data: {
        lastCheckInAt: new Date(),
        churnRisk,
        churnRiskUpdatedAt: new Date(),
      },
    });

    // Create alert if needed
    if (alertLevel !== AlertLevel.NORMAL) {
      await this.prisma.alert.create({
        data: {
          customerId: checkIn.customerId,
          type:
            alertLevel === AlertLevel.URGENT
              ? AlertType.CHURN_RISK
              : AlertType.LOW_ADHERENCE,
          level: alertLevel,
          title: this.getAlertTitle(alertLevel),
          message: this.getAlertMessage(alertLevel, responses),
        },
      });
    }

    this.logger.log(`Check-in completed: ${id} (alert: ${alertLevel})`);

    return {
      id: updated.id,
      customerId: updated.customerId,
      status: updated.status,
      alertLevel: updated.alertLevel,
      trend,
    };
  }

  async findByCustomer(customerId: string, limit = 20) {
    return this.prisma.checkIn.findMany({
      where: { customerId },
      orderBy: { scheduledAt: "desc" },
      take: limit,
    });
  }

  async findPending() {
    return this.prisma.checkIn.findMany({
      where: {
        status: CheckInStatus.PENDING,
        scheduledAt: { lte: new Date() },
      },
      include: {
        customer: {
          select: {
            id: true,
            lead: { select: { name: true, phone: true } },
            responsibleUser: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async getCustomerTrends(customerId: string) {
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        customerId,
        status: CheckInStatus.COMPLETED,
        responses: { not: PrismaNull },
      },
      orderBy: { completedAt: "asc" },
    });

    if (checkIns.length < 2)
      return {
        trends: {},
        message: "Dados insuficientes para calcular tendências",
      };

    const trends: Record<
      string,
      { values: number[]; direction: string; change: number }
    > = {};

    for (const ci of checkIns) {
      const responses = ci.responses as Record<
        string,
        number | string | boolean
      >;
      for (const [key, value] of Object.entries(responses)) {
        if (typeof value === "number") {
          if (!trends[key])
            trends[key] = { values: [], direction: "stable", change: 0 };
          trends[key].values.push(value);
        }
      }
    }

    for (const [, data] of Object.entries(trends)) {
      if (data.values.length >= 2) {
        const first = data.values[0];
        const last = data.values[data.values.length - 1];
        data.change = last - first;
        data.direction =
          data.change > 0.5
            ? "improving"
            : data.change < -0.5
              ? "declining"
              : "stable";
      }
    }

    return { trends };
  }

  private calculateAlertLevel(
    responses: Record<string, number | string | boolean>,
  ): AlertLevel {
    let lowCount = 0;
    let criticalCount = 0;

    for (const [key, value] of Object.entries(responses)) {
      if (typeof value === "number") {
        if (value <= 2) lowCount++;
        if (value <= 1) criticalCount++;
      }
      if (key === "support_needed" && value === true) {
        return AlertLevel.PRIORITY;
      }
    }

    if (criticalCount >= 2) return AlertLevel.URGENT;
    if (lowCount >= 2) return AlertLevel.ATTENTION;
    if (criticalCount >= 1) return AlertLevel.PRIORITY;
    return AlertLevel.NORMAL;
  }

  private calculateTrend(
    current: Record<string, number | string | boolean>,
    previousCheckIns: any[],
  ): {
    direction: "improving" | "stable" | "declining";
    comparisons: Record<string, any>;
  } {
    if (previousCheckIns.length === 0) {
      return { direction: "stable", comparisons: {} };
    }

    const lastResponse = previousCheckIns[0]?.responses as Record<
      string,
      number | string | boolean
    > | null;
    if (!lastResponse) {
      return { direction: "stable", comparisons: {} };
    }

    const comparisons: Record<
      string,
      { previous: number; current: number; change: number }
    > = {};

    for (const [key, currentValue] of Object.entries(current)) {
      if (
        typeof currentValue === "number" &&
        typeof lastResponse[key] === "number"
      ) {
        const previous = lastResponse[key] as number;
        comparisons[key] = {
          previous,
          current: currentValue,
          change: currentValue - previous,
        };
      }
    }

    const changes = Object.values(comparisons);
    if (changes.length === 0) return { direction: "stable", comparisons };

    const avgChange =
      changes.reduce((acc, c) => acc + c.change, 0) / changes.length;

    return {
      direction:
        avgChange > 0.3
          ? "improving"
          : avgChange < -0.3
            ? "declining"
            : "stable",
      comparisons,
    };
  }

  private calculateChurnRisk(
    alertLevel: AlertLevel,
    trend: { direction: string },
  ): number {
    let risk = 0;
    if (alertLevel === AlertLevel.ATTENTION) risk = 0.3;
    if (alertLevel === AlertLevel.PRIORITY) risk = 0.5;
    if (alertLevel === AlertLevel.URGENT) risk = 0.8;
    if (trend.direction === "declining") risk += 0.15;
    return Math.min(risk, 1);
  }

  private getAlertTitle(level: AlertLevel): string {
    const titles = {
      [AlertLevel.ATTENTION]: "Sinal de atenção no check-in",
      [AlertLevel.PRIORITY]: "Check-in prioritário requer atenção",
      [AlertLevel.URGENT]: "Check-in urgente — intervenção necessária",
    };
    return titles[level] || "Alerta de check-in";
  }

  private getAlertMessage(
    level: AlertLevel,
    responses: Record<string, any>,
  ): string {
    return `Check-in com nível ${level.toLowerCase()}. Respostas: ${JSON.stringify(responses)}`;
  }
}

const PrismaNull = "PRISMA_NULL_PLACEHOLDER" as any;
