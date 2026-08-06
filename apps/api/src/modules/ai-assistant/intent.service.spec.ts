import { IntentService } from "./intent.service";

describe("IntentService", () => {
  let service: IntentService;

  beforeEach(() => {
    service = new IntentService();
  });

  it("classifies pricing queries", () => {
    const result = service.classify("quanto custa o plano essencial?");
    expect(result.intent).toBe("pricing");
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("classifies appointment requests", () => {
    const result = service.classify("quero marcar uma consulta");
    expect(result.intent).toBe("appointment");
  });

  it("classifies program questions", () => {
    const result = service.classify("como funciona o programa");
    expect(result.intent).toBe("program");
  });

  it("classifies checkin answers", () => {
    const result = service.classify("hoje sinto-me bem, energia boa");
    expect(result.intent).toBe("checkin");
  });

  it("classifies greetings", () => {
    const result = service.classify("Olá, tudo bem?");
    expect(result.intent).toBe("greeting");
  });

  it("returns unknown for empty input", () => {
    const result = service.classify("   ");
    expect(result.intent).toBe("unknown");
    expect(result.confidence).toBe(0);
  });

  it("normalises accents and casing", () => {
    const result = service.classify("QUANTO CUSTA A SUBSCRIÇÃO?");
    expect(result.intent).toBe("pricing");
    expect(result.normalized).toContain("subscricao");
  });
});
