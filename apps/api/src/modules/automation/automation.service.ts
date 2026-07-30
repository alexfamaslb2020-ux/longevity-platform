import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventPublisherService } from "./event-publisher.service";
import { WorkflowMatcherService } from "./workflow-matcher.service";
import { ActionExecutorService } from "./action-executor.service";
import { PrismaService } from "../../common/prisma.service";
import { AutomationEvent, AutomationEventPayload } from "./events";

@Injectable()
export class AutomationService implements OnModuleInit {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly eventPublisher: EventPublisherService,
    private readonly workflowMatcher: WorkflowMatcherService,
    private readonly actionExecutor: ActionExecutorService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Register handler for all events
    const events = Object.values(AutomationEvent);
    for (const event of events) {
      this.eventPublisher.on(event, (payload) => this.handleEvent(payload));
    }
    this.logger.log(
      `Automation engine initialized with ${events.length} event types`,
    );
  }

  async publish(
    event: AutomationEvent,
    payload: Omit<AutomationEventPayload, "event" | "timestamp">,
  ) {
    await this.eventPublisher.publish(event, payload);
  }

  private eventToTriggerType(event: string): any {
    const map: Record<string, any> = {
      "lead.created": "LEAD_CREATED",
      "lead.stage_changed": "STAGE_CHANGED",
      "lead.converted": "LEAD_CREATED",
      "appointment.created": "APPOINTMENT_CREATED",
      "appointment.cancelled": "APPOINTMENT_CANCELLED",
      "appointment.missed": "APPOINTMENT_NO_SHOW",
      "checkin.created": "CHECK_IN_COMPLETED",
      "checkin.completed": "CHECK_IN_COMPLETED",
      "checkin.overdue": "CHECK_IN_MISSED",
      "customer.risk_changed": "CUSTOMER_INACTIVE",
      "message.received": "MESSAGE_RECEIVED",
      "call.completed": "CALL_COMPLETED",
    };
    return (map[event] || "LEAD_CREATED") as any;
  }

  private async handleEvent(payload: AutomationEventPayload) {
    try {
      const matched = await this.workflowMatcher.match(payload);

      if (matched.length === 0) return;

      for (const workflow of matched) {
        await this.executeWorkflow(workflow, payload);
      }
    } catch (error: any) {
      this.logger.error(
        `Error handling event ${payload.event}: ${error.message}`,
      );
    }
  }

  private async executeWorkflow(
    workflow: {
      workflowId: string;
      actions: {
        type: string;
        params: Record<string, unknown>;
        order: number;
      }[];
    },
    payload: AutomationEventPayload,
  ) {
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: workflow.workflowId,
        triggerType: this.eventToTriggerType(payload.event),
        entityId: payload.entityId,
        entityType: payload.entityType,
        status: "running",
        startedAt: new Date(),
      },
    });

    try {
      const results: Record<string, unknown>[] = [];
      for (const action of workflow.actions.sort((a, b) => a.order - b.order)) {
        const result = await this.actionExecutor.execute(action, {
          entityId: payload.entityId,
          organizationId: payload.organizationId,
          entityType: payload.entityType,
        });
        results.push(result);
      }

      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          result: { actions: results } as any,
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Workflow execution ${execution.id} failed: ${error.message}`,
      );
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        },
      });
    }
  }
}
