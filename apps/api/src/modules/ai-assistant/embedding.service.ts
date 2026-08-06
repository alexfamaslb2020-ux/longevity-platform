import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export type EmbeddingProviderName = "local" | "ollama";

export interface EmbeddingProvider {
  name: EmbeddingProviderName;
  dimension: number;
  embedText(text: string): Promise<number[]>;
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function normalizeNfkd(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Embeddings locais e determinísticos (sem chamadas externas).
 * Feature hashing sobre tokens (palavras) e caracteres 4-grams, com
 * pesos tf-ish, e normalização L2. Determinístico entre execuções, o que
 * torna testes e reprodução fiáveis. Suficiente para pesquisa semântica
 * demonstrável em português sobre documentos sintéticos.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  name: EmbeddingProviderName = "local";
  constructor(public readonly dimension: number) {}

  async embedText(text: string): Promise<number[]> {
    const vector = this.embedSync(text);
    return vector;
  }

  embedSync(text: string): number[] {
    const dim = this.dimension;
    const acc = new Float64Array(dim);

    const tokens = this.tokenize(text);
    for (const token of tokens) {
      const h = fnv1a(token);
      const idx = h % dim;
      const sign = h & 1 ? 1 : -1;
      const weight = 1 + Math.log(1 + token.length);
      acc[idx] += sign * weight;
    }

    // normalizar L2
    let norm = 0;
    for (let i = 0; i < dim; i++) norm += acc[i] * acc[i];
    norm = Math.sqrt(norm) || 1;
    const out = new Array<number>(dim);
    for (let i = 0; i < dim; i++) out[i] = acc[i] / norm;
    return out;
  }

  private tokenize(text: string): string[] {
    const cleaned = normalizeNfkd(text).replace(/[^a-z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
    const tokens = words.slice();
    // caracteres 4-grams para robustez em português
    const compact = words.join("");
    if (compact.length >= 4) {
      for (let i = 0; i <= compact.length - 4; i++) {
        tokens.push(`ng:${compact.slice(i, i + 4)}`);
      }
    }
    return tokens;
  }

  static toVectorLiteral(values: number[]): string {
    return `[${values.join(",")}]`;
  }
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: EmbeddingProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const dims = this.configService.get<number>(
      "aiAssistant.embedding.dimensions",
      384,
    );
    const providerName = this.configService.get<string>(
      "aiAssistant.embedding.provider",
      "local",
    );
    if (providerName === "ollama") {
      this.provider = new OllamaEmbeddingProvider(
        dims,
        this.configService.get<string>(
          "aiAssistant.embedding.ollamaBaseUrl",
          "http://localhost:11434",
        ),
        this.configService.get<string>(
          "aiAssistant.embedding.ollamaModel",
          "nomic-embed-text",
        ),
        this.httpService,
        this.logger,
      );
    } else {
      this.provider = new LocalEmbeddingProvider(dims);
    }
  }

  get name(): string {
    return this.provider.name;
  }

  get dimension(): number {
    return this.provider.dimension;
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  embedText(text: string): Promise<number[]> {
    return this.provider.embedText(text);
  }

  toVectorLiteral(values: number[]): string {
    return LocalEmbeddingProvider.toVectorLiteral(values);
  }
}

class OllamaEmbeddingProvider implements EmbeddingProvider {
  name: EmbeddingProviderName = "ollama";

  constructor(
    public readonly dimension: number,
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ embedding: number[] }>(
          `${this.baseUrl}/api/embeddings`,
          { model: this.model, prompt: text },
          { timeout: 15000 },
        ),
      );
      const embedding = response.data?.embedding;
      if (!Array.isArray(embedding)) {
        throw new Error("resposta sem campo embedding");
      }
      this.logger.log(`Ollama embedding via ${this.model}`);
      if (embedding.length !== this.dimension) {
        this.logger.warn(
          `Dimensão Ollama (${embedding.length}) difere da configurada (${this.dimension}) — a usar a do modelo`,
        );
      }
      return embedding;
    } catch (error: unknown) {
      const message = error as { message?: string };
      this.logger.warn(
        `Ollama embeddings indisponível em ${this.baseUrl} (${message.message}) — fallback para embeddings locais`,
      );
      const local = new LocalEmbeddingProvider(this.dimension);
      return local.embedSync(text);
    }
  }
}
