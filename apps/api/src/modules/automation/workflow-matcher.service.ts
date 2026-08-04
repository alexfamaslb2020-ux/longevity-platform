import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { ConditionEvaluatorService } from "./condition-evaluator.service";
import {
  AutomationEventPayload,
  MatchedWorkflow,
  WorkflowCondition,
  WorkflowAction,
} from "./events";

@Injectable()
export class WorkflowMatcherService {
  private readonly logger = new Logger(WorkflowMatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
  ) {}

  async match(payload: AutomationEventPayload): Promise<MatchedWorkflow[]> {
    const workflows = await this.prisma.workflow.findMany({
      where: { active: true },
      orderBy: { priority: "asc" },
    });

    const matched: MatchedWorkflow[] = [];

    for (const wf of workflows) {
      const triggers = (wf.triggers as string[]) || [];
      const triggerMatch = triggers.some((t) =>
        this.matchesEvent(t, payload.event),
      );
      if (!triggerMatch) continue;

      const conditions = (wf.conditions as WorkflowCondition[] | null) || [];
      if (this.conditionEvaluator.evaluate(conditions, payload)) {
        matched.push({
          workflowId: wf.id,
          triggerType: payload.event,
          conditions,
          actions: (wf.actions as WorkflowAction[] | null) || [],
        });
      }
    }

    return matched;
  }

  private matchesEvent(trigger: string, event: string): boolean {
    if (trigger === event) return true;
    const map: Record<string, string[]> = {
      LEAD_CREATED: ["lead.created"],
      STAGE_CHANGED: ["lead.stage_changed"],
      APPOINTMENT_CREATED: ["appointment.created"],
      APPOINTMENT_CANCELLED: ["appointment.cancelled"],
      APPOINTMENT_NO_SHOW: ["appointment.missed"],
      CHECK_IN_COMPLETED: ["checkin.completed"],
      CHECK_IN_MISSED: ["checkin.overdue", "checkin.created"],
      MESSAGE_RECEIVED: ["message.received"],
      CALL_COMPLETED: ["call.completed"],
    };
    const mapped = map[trigger];
    return mapped ? mapped.includes(event) : false;
  }
}
