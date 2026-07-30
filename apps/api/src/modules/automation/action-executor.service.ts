import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { WorkflowAction } from "./events";

@Injectable()
export class ActionExecutorService {
  private readonly logger = new Logger(ActionExecutorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    action: WorkflowAction,
    context: { entityId: string; organizationId: string; entityType: string },
  ): Promise<Record<string, unknown>> {
    this.logger.log(
      `Executing action: ${action.type} (order: ${action.order})`,
    );

    switch (action.type) {
      case "CREATE_TASK":
        return this.createTask(action.params, context);
      case "CREATE_ALERT":
        return this.createAlert(action.params, context);
      case "CREATE_NOTIFICATION":
        return this.createNotification(action.params, context);
      case "CHANGE_STAGE":
        return this.changeStage(action.params, context);
      case "ADD_TAG":
        return this.addTag(action.params, context);
      case "SCHEDULE_CHECKIN":
        return this.scheduleCheckin(action.params, context);
      case "UPDATE_LAST_INTERACTION":
        return this.updateLastInteraction(action.params, context);
      case "CALL_WEBHOOK":
        return this.callWebhook(action.params, context);
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
        return { skipped: true, reason: `Unknown action type: ${action.type}` };
    }
  }

  private async createTask(
    params: Record<string, unknown>,
    context: { entityId: string; entityType: string },
  ) {
    const title = (params.title as string) || "Tarefa automática";
    const description = (params.description as string) || "";
    const assignedToId = (params.assignedToId as string) || undefined;

    const relatedTo =
      context.entityType === "lead"
        ? "lead"
        : context.entityType === "customer"
          ? "customer"
          : undefined;

    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        priority: (params.priority as any) || "MEDIUM",
        status: "PENDING" as any,
        assignedToId,
        relatedTo,
        relatedId: context.entityId,
        metadata: { automated: true, sourceAction: "workflow" } as any,
      },
    });
    this.logger.log(`Task created: ${task.id}`);
    return { taskId: task.id };
  }

  private async createAlert(
    params: Record<string, unknown>,
    context: { entityId: string; entityType: string },
  ) {
    const customerId =
      context.entityType === "customer"
        ? context.entityId
        : (params.customerId as string);
    if (!customerId) return { skipped: true, reason: "No customer ID" };

    const alert = await this.prisma.alert.create({
      data: {
        customerId,
        level: (params.level as any) || "ATTENTION",
        type: (params.type as any) || "AUTOMATION_FAILURE",
        title: (params.title as string) || "Alerta automático",
        message: (params.description as string) || "",
        metadata: { automated: true } as any,
      },
    });
    return { alertId: alert.id };
  }

  private async createNotification(
    params: Record<string, unknown>,
    _context: { entityId: string; organizationId: string },
  ) {
    const userId = params.userId as string;
    if (!userId) return { skipped: true, reason: "No user ID" };

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        channel: "APP" as any,
        type: (params.type as string) || "AUTOMATION",
        title: (params.title as string) || "Notificação automática",
        body: (params.body as string) || "",
        metadata: { automated: true } as any,
      },
    });
    return { notificationId: notification.id };
  }

  private async changeStage(
    params: Record<string, unknown>,
    _context: { entityId: string; organizationId: string },
  ) {
    const leadId = params.leadId as string;
    const stageId = params.stageId as string;
    if (!leadId || !stageId)
      return { skipped: true, reason: "Missing leadId or stageId" };

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { pipelineStageId: stageId },
    });
    return { success: true };
  }

  private async addTag(
    params: Record<string, unknown>,
    _context: { entityId: string; organizationId: string },
  ) {
    const leadId = params.leadId as string;
    const tag = params.tag as string;
    if (!leadId || !tag)
      return { skipped: true, reason: "Missing leadId or tag" };

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { tags: { push: tag } },
    });
    return { success: true };
  }

  private async scheduleCheckin(
    params: Record<string, unknown>,
    context: { entityId: string; organizationId: string },
  ) {
    const customerId = (params.customerId as string) || context.entityId;
    const daysFromNow = (params.daysFromNow as number) || 7;

    const checkin = await this.prisma.checkIn.create({
      data: {
        customerId,
        status: "PENDING" as any,
        type: (params.type as string) || "weekly",
        channel: "APP" as any,
        scheduledAt: new Date(Date.now() + daysFromNow * 86400000),
        metadata: { automated: true } as any,
      },
    });
    return { checkinId: checkin.id };
  }

  private async updateLastInteraction(
    params: Record<string, unknown>,
    _context: { entityId: string; organizationId: string },
  ) {
    const leadId = params.leadId as string;
    const customerId = params.customerId as string;

    if (leadId) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { lastContactedAt: new Date() },
      });
    }
    if (customerId) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: { lastContactAt: new Date() },
      });
    }
    return { success: true };
  }

  private async callWebhook(
    params: Record<string, unknown>,
    _context: { entityId: string; organizationId: string },
  ) {
    const url = params.url as string;
    if (!url) return { skipped: true, reason: "No webhook URL" };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: params.event,
          data: params.payload || {},
          timestamp: new Date().toISOString(),
        }),
      });
      return { status: response.status, ok: response.ok };
    } catch (error: any) {
      this.logger.error(`Webhook call failed: ${error.message}`);
      return { failed: true, error: error.message };
    }
  }
}
