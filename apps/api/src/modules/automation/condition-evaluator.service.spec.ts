import { ConditionEvaluatorService } from "./condition-evaluator.service";
import { AutomationEvent, AutomationEventPayload } from "./events";

describe("ConditionEvaluatorService", () => {
  let service: ConditionEvaluatorService;
  let basePayload: AutomationEventPayload;

  beforeEach(() => {
    service = new ConditionEvaluatorService();
    basePayload = {
      event: AutomationEvent.LEAD_CREATED,
      entityId: "123",
      entityType: "lead",
      organizationId: "org-1",
      timestamp: new Date(),
      data: { status: "NEW", score: 50, source: "WEBSITE" },
    };
  });

  it("returns true for empty conditions", () => {
    expect(service.evaluate([], basePayload)).toBe(true);
  });

  it("evaluates eq operator", () => {
    const conditions = [
      { field: "data.status", operator: "eq" as const, value: "NEW" },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);

    const wrong = [
      { field: "data.status", operator: "eq" as const, value: "QUALIFIED" },
    ];
    expect(service.evaluate(wrong, basePayload)).toBe(false);
  });

  it("evaluates gt operator", () => {
    const conditions = [
      { field: "data.score", operator: "gt" as const, value: 30 },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);

    const wrong = [{ field: "data.score", operator: "gt" as const, value: 70 }];
    expect(service.evaluate(wrong, basePayload)).toBe(false);
  });

  it("evaluates in operator", () => {
    const conditions = [
      {
        field: "data.source",
        operator: "in" as const,
        value: ["WEBSITE", "REFERRAL"],
      },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);
  });

  it("evaluates contains operator", () => {
    const conditions = [
      { field: "data.status", operator: "contains" as const, value: "NEW" },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);
  });

  it("evaluates ne operator", () => {
    const conditions = [
      { field: "data.status", operator: "ne" as const, value: "CONVERTED" },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);
  });

  it("evaluates multiple conditions with AND logic", () => {
    const conditions = [
      { field: "data.status", operator: "eq" as const, value: "NEW" },
      { field: "data.score", operator: "gte" as const, value: 50 },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);

    const mixed = [
      { field: "data.status", operator: "eq" as const, value: "NEW" },
      { field: "data.score", operator: "lt" as const, value: 50 },
    ];
    expect(service.evaluate(mixed, basePayload)).toBe(false);
  });

  it("resolves entityId from payload top-level fields", () => {
    const conditions = [
      { field: "entityId", operator: "eq" as const, value: "123" },
    ];
    expect(service.evaluate(conditions, basePayload)).toBe(true);
  });
});
