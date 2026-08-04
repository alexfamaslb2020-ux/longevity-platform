import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Prisma, WorkflowTriggerType } from "@prisma/client";
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

  private eventToTriggerType(event: string): WorkflowTriggerType {
    const map: Record<string, WorkflowTriggerType> = {
      "lead.created": WorkflowTriggerType.LEAD_CREATED,
      "lead.stage_changed": WorkflowTriggerType.LEAD_CREATED,
      "lead.converted": WorkflowTriggerType.LEAD_CREATED,
      "appointment.created": WorkflowTriggerType.APPOINTMENT_CREATED,
      "appointment.cancelled": WorkflowTriggerType.APPOINTMENT_CANCELLED,
      "appointment.missed": WorkflowTriggerType.APPOINTMENT_NO_SHOW,
      "checkin.created": WorkflowTriggerType.CHECK_IN_COMPLETED,
      "checkin.completed": WorkflowTriggerType.CHECK_IN_COMPLETED,
      "checkin.overdue": WorkflowTriggerType.CHECK_IN_MISSED,
      "customer.risk_changed": WorkflowTriggerType.CUSTOMER_INACTIVE,
      "message.received": WorkflowTriggerType.MESSAGE_RECEIVED,
      "call.completed": WorkflowTriggerType.CALL_COMPLETED,
    };
    return map[event] || WorkflowTriggerType.LEAD_CREATED;
  }

  private async handleEvent(payload: AutomationEventPayload) {
    try {
      const matched = await this.workflowMatcher.match(payload);

      if (matched.length === 0) return;

      for (const workflow of matched) {
        await this.executeWorkflow(workflow, payload);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling event ${payload.event}: ${message}`);
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
          result: { actions: results } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Workflow execution ${execution.id} failed: ${message}`,
      );
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          error: message,
          completedAt: new Date(),
        },
      });
    }
  }
}
