import { Injectable } from "@nestjs/common";
import { WorkflowCondition, AutomationEventPayload } from "./events";

@Injectable()
export class ConditionEvaluatorService {
  evaluate(
    conditions: WorkflowCondition[],
    payload: AutomationEventPayload,
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((c) => {
      const actualValue = this.resolveValue(c.field, payload);
      return this.compare(actualValue, c.operator, c.value);
    });
  }

  private resolveValue(
    field: string,
    payload: AutomationEventPayload,
  ): unknown {
    if (field.startsWith("data.")) {
      return payload.data[field.slice(5)];
    }
    const key = field as keyof AutomationEventPayload;
    return (payload as any)[key];
  }

  private compare(
    actual: unknown,
    operator: string,
    expected: unknown,
  ): boolean {
    switch (operator) {
      case "eq":
        return actual === expected;
      case "ne":
        return actual !== expected;
      case "gt":
        return (
          typeof actual === "number" &&
          typeof expected === "number" &&
          actual > expected
        );
      case "gte":
        return (
          typeof actual === "number" &&
          typeof expected === "number" &&
          actual >= expected
        );
      case "lt":
        return (
          typeof actual === "number" &&
          typeof expected === "number" &&
          actual < expected
        );
      case "lte":
        return (
          typeof actual === "number" &&
          typeof expected === "number" &&
          actual <= expected
        );
      case "in":
        return Array.isArray(expected) && expected.includes(actual);
      case "contains":
        return (
          typeof actual === "string" &&
          typeof expected === "string" &&
          actual.includes(expected)
        );
      default:
        return false;
    }
  }
}
