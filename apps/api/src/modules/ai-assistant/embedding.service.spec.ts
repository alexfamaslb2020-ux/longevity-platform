import { EmbeddingService } from "./embedding.service";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";

const createConfig = (overrides: Record<string, unknown> = {}) => {
  const store = new Map<string, unknown>();
  store.set("aiAssistant.embedding.provider", overrides.provider ?? "local");
  store.set("aiAssistant.embedding.dimensions", overrides.dimensions ?? 384);
  store.set(
    "aiAssistant.embedding.ollamaModel",
    overrides.model ?? "nomic-embed-text",
  );
  store.set(
    "aiAssistant.embedding.ollamaBaseUrl",
    overrides.ollamaBaseUrl ?? "",
  );
  return {
    get: jest.fn((key: string) => store.get(key) ?? null),
  } as unknown as ConfigService;
};

describe("EmbeddingService", () => {
  let service: EmbeddingService;

  beforeEach(() => {
    service = new EmbeddingService(createConfig(), {} as HttpService);
  });

  it("embeds a text into a fixed-size vector", async () => {
    const vector = await service.embedText("Preço de um programa de longevity");
    expect(vector).toHaveLength(384);
    expect(vector.every((v) => typeof v === "number")).toBe(true);
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("is deterministic for the same text", async () => {
    const a = await service.embedText("Plano de 6 meses preço");
    const b = await service.embedText("Plano de 6 meses preço");
    expect(a).toEqual(b);
  });

  it("produces cosine-similar vectors for related texts", async () => {
    const a = await service.embedText("quanto custa o programa de 6 meses");
    const b = await service.embedText("preço plano semestral longevity");
    const c = await service.embedText("o tempo hoje está chuvoso");
    const simRelated = EmbeddingService.cosineSimilarity(a, b);
    const simUnrelated = EmbeddingService.cosineSimilarity(a, c);
    expect(simRelated).toBeGreaterThan(simUnrelated);
    expect(simUnrelated).toBeLessThan(0.3);
  });

  it("reports provider name and dimension", () => {
    expect(service.name).toBe("local");
    expect(service.dimension).toBe(384);
  });

  it("serialises a vector into a pgvector literal", async () => {
    const vector = new Array(384).fill(0.5);
    const literal = service.toVectorLiteral(vector);
    expect(literal).toBe(`[${vector.join(",")}]`);
  });
});
