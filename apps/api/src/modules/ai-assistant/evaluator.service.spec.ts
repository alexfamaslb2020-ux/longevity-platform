import { EvaluatorService } from "./evaluator.service";
import { ConfigService } from "@nestjs/config";

const createConfig = (latencyTargetMs = 1500) =>
  ({
    get: jest.fn((key: string) =>
      key === "aiAssistant.evaluation.latencyTargetMs" ? latencyTargetMs : null,
    ),
  }) as unknown as ConfigService;

describe("EvaluatorService", () => {
  let service: EvaluatorService;

  beforeEach(() => {
    service = new EvaluatorService(createConfig());
  });

  it("scores a well-grounded RAG answer near 100", () => {
    const result = service.evaluate({
      intent: "pricing",
      grounded: true,
      refused: false,
      usedTool: false,
      toolSuccess: false,
      hasContext: true,
      sourceCount: 2,
      minSimilarity: 0.32,
      latencyMs: 200,
      answerLength: 320,
    });
    expect(result.score).toBe(100);
    expect(result.criteria.map((c) => c.name)).toEqual([
      "grounding",
      "honest_refusal",
      "source_trace",
      "latency",
      "completeness",
    ]);
    expect(result.criteria.every((c) => c.passed)).toBe(true);
  });

  it("penalises hallucination risk (answer without context)", () => {
    const result = service.evaluate({
      intent: "pricing",
      grounded: false,
      refused: false,
      usedTool: false,
      toolSuccess: false,
      hasContext: false,
      sourceCount: 0,
      minSimilarity: 0.32,
      latencyMs: 200,
      answerLength: 300,
    });
    expect(
      result.criteria.find((c) => c.name === "honest_refusal")?.passed,
    ).toBe(false);
    expect(result.criteria.find((c) => c.name === "source_trace")?.passed).toBe(
      false,
    );
    expect(result.score).toBeLessThan(60);
  });

  it("rewards honest refusal when there is no context", () => {
    const result = service.evaluate({
      intent: "faq",
      grounded: false,
      refused: true,
      usedTool: false,
      toolSuccess: false,
      hasContext: false,
      sourceCount: 0,
      minSimilarity: 0.32,
      latencyMs: 100,
      answerLength: 150,
    });
    expect(
      result.criteria.find((c) => c.name === "honest_refusal")?.passed,
    ).toBe(true);
  });

  it("requires tool use for appointment intents", () => {
    const noTool = service.evaluate({
      intent: "appointment",
      grounded: false,
      refused: false,
      usedTool: false,
      toolSuccess: false,
      hasContext: false,
      sourceCount: 0,
      minSimilarity: 0.32,
      latencyMs: 100,
      answerLength: 300,
    });
    expect(noTool.criteria.find((c) => c.name === "tool_use")?.passed).toBe(
      false,
    );

    const withTool = service.evaluate({
      intent: "appointment",
      grounded: false,
      refused: false,
      usedTool: true,
      toolSuccess: true,
      hasContext: false,
      sourceCount: 0,
      minSimilarity: 0.32,
      latencyMs: 100,
      answerLength: 300,
    });
    expect(withTool.criteria.find((c) => c.name === "tool_use")?.passed).toBe(
      true,
    );
  });

  it("fails latency criterion above the configured target", () => {
    service = new EvaluatorService(createConfig(1500));
    const result = service.evaluate({
      intent: "program",
      grounded: true,
      refused: false,
      usedTool: false,
      toolSuccess: false,
      hasContext: true,
      sourceCount: 1,
      minSimilarity: 0.32,
      latencyMs: 2000,
      answerLength: 400,
    });
    expect(result.criteria.find((c) => c.name === "latency")?.passed).toBe(
      false,
    );
  });

  it("fails completeness for very short answers", () => {
    const result = service.evaluate({
      intent: "greeting",
      grounded: false,
      refused: false,
      usedTool: false,
      toolSuccess: false,
      hasContext: false,
      sourceCount: 0,
      minSimilarity: 0.32,
      latencyMs: 50,
      answerLength: 5,
    });
    expect(result.criteria.find((c) => c.name === "completeness")?.passed).toBe(
      false,
    );
  });
});
