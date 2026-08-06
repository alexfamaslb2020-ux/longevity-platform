import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma.service";
import type { RetrievedChunk } from "./ai-assistant.types";

interface ChunkRow {
  chunk_id: string;
  document_id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

/**
 * Pesquisa semântica sobre pgvector (cosine similarity).
 * A consulta usa $queryRawUnsafe com parâmetros posicionais ($1 vetor,
 * $2 organization_id opcional) — o embedding é sempre parametrizado,
 * nunca interpolado em SQL.
 */
@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async search(
    embedding: number[],
    organizationId: string | null | undefined,
  ): Promise<RetrievedChunk[]> {
    const vectorLiteral = `[${embedding.join(",")}]`;
    const topK = this.configService.get<number>(
      "aiAssistant.retrieval.topK",
      3,
    );
    const minSimilarity = this.configService.get<number>(
      "aiAssistant.retrieval.minSimilarity",
      0.32,
    );

    const orgFilter = organizationId ? `AND d.organization_id = $2::uuid` : "";

    const sql = `
      SELECT c.id AS chunk_id,
             c.document_id AS document_id,
             d.title,
             d.category,
             c.content,
             1 - (c.embedding <=> $1::vector) AS similarity
      FROM knowledge_chunks c
      JOIN knowledge_documents d ON d.id = c.document_id
      WHERE c.embedding IS NOT NULL
        ${orgFilter}
      ORDER BY c.embedding <=> $1::vector
      LIMIT ${topK}
    `;

    const rows = await this.prisma.$queryRawUnsafe<ChunkRow[]>(
      sql,
      vectorLiteral,
      ...(organizationId ? [organizationId] : []),
    );

    return rows
      .filter((row) => row.similarity >= minSimilarity)
      .map((row) => ({
        chunkId: row.chunk_id,
        documentId: row.document_id,
        title: row.title,
        category: row.category,
        content: row.content,
        similarity: Number(row.similarity.toFixed(4)),
      }));
  }

  async count(): Promise<{ documents: number; chunks: number }> {
    const [documents, chunks] = await Promise.all([
      this.prisma.knowledgeDocument.count(),
      this.prisma.knowledgeChunk.count(),
    ]);
    return { documents, chunks };
  }

  async setChunkEmbedding(
    chunkId: string,
    vectorLiteral: string,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE knowledge_chunks SET embedding = $1::vector WHERE id = $2::uuid`,
      vectorLiteral,
      chunkId,
    );
  }
}
