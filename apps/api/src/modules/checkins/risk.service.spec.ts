import { RiskService, RiskLevel } from "./risk.service";

describe("RiskService", () => {
  let service: RiskService;

  beforeEach(() => {
    service = new RiskService();
  });

  it("returns NORMAL for healthy check-in", () => {
    const result = service.calculate({
      energy: 8,
      sleep: 8,
      stress: 3,
      mood: 8,
      adherence: 9,
      satisfaction: 9,
    });
    expect(result.level).toBe(RiskLevel.NORMAL);
    expect(result.requiresHumanReview).toBe(false);
    expect(result.score).toBeLessThan(2);
  });

  it("returns CRITICAL for high-risk check-in", () => {
    const result = service.calculate({
      energy: 2,
      sleep: 3,
      stress: 9,
      mood: 2,
      adherence: 2,
      satisfaction: 1,
      dropoutIntention: true,
      requestContact: true,
    });
    expect(result.level).toBe(RiskLevel.CRITICAL);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(7);
  });

  it("returns HIGH for mixed risk factors", () => {
    const result = service.calculate({
      energy: 4,
      sleep: 5,
      stress: 7,
      mood: 4,
      adherence: 4,
      satisfaction: 3,
    });
    expect(result.level).toBe(RiskLevel.HIGH);
    expect(result.requiresHumanReview).toBe(true);
  });

  it("returns ATTENTION for moderate risk", () => {
    const result = service.calculate({
      energy: 6,
      sleep: 5,
      stress: 6,
    });
    expect(result.level).toBe(RiskLevel.ATTENTION);
    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.score).toBeLessThan(4.5);
  });

  it("includes dropout intention as critical factor", () => {
    const result = service.calculate({
      energy: 7,
      sleep: 7,
      stress: 4,
      dropoutIntention: true,
    });
    const dropoutFactor = result.factors.find(
      (f) => f.name === "dropout_intention",
    );
    expect(dropoutFactor).toBeDefined();
    expect(dropoutFactor!.weight).toBe(5);
    expect(dropoutFactor!.score).toBe(10);
  });

  it("detects high variation from previous check-in", () => {
    const result = service.calculate(
      { energy: 8, sleep: 7, stress: 3 },
      { energy: 3, sleep: 7, stress: 3 },
    );
    const variationFactor = result.factors.find(
      (f) => f.name === "high_variation",
    );
    expect(variationFactor).toBeDefined();
  });

  it("returns empty factors for no data", () => {
    const result = service.calculate({});
    expect(result.level).toBe(RiskLevel.NORMAL);
    expect(result.factors).toHaveLength(0);
    expect(result.score).toBe(0);
  });

  it("produces deterministic results", () => {
    const input = {
      energy: 5,
      sleep: 6,
      stress: 5,
      mood: 5,
      adherence: 6,
      satisfaction: 5,
    };
    const r1 = service.calculate(input);
    const r2 = service.calculate(input);
    expect(r1.score).toBe(r2.score);
    expect(r1.level).toBe(r2.level);
    expect(r1.factors).toEqual(r2.factors);
  });
});
