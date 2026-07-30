export enum AutomationEvent {
  LEAD_CREATED = "lead.created",
  LEAD_STAGE_CHANGED = "lead.stage_changed",
  LEAD_CONVERTED = "lead.converted",
  APPOINTMENT_CREATED = "appointment.created",
  APPOINTMENT_CANCELLED = "appointment.cancelled",
  APPOINTMENT_MISSED = "appointment.missed",
  CHECKIN_CREATED = "checkin.created",
  CHECKIN_COMPLETED = "checkin.completed",
  CHECKIN_OVERDUE = "checkin.overdue",
  CUSTOMER_RISK_CHANGED = "customer.risk_changed",
  MESSAGE_RECEIVED = "message.received",
  CALL_COMPLETED = "call.completed",
}

export interface AutomationEventPayload {
  event: AutomationEvent;
  entityId: string;
  entityType: string;
  organizationId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  correlationId?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  value: unknown;
}

export interface WorkflowAction {
  type: string;
  params: Record<string, unknown>;
  order: number;
}

export interface MatchedWorkflow {
  workflowId: string;
  triggerType: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}
