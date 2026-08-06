import { registerAs } from "@nestjs/config";

export default registerAs("aiAssistant", () => ({
  enabled: process.env.RAG_ENABLED !== "false",
  embedding: {
    provider: process.env.RAG_EMBEDDING_PROVIDER || "local", // "local" | "ollama"
    dimensions: Number(process.env.RAG_EMBEDDING_DIMENSIONS || 384),
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    ollamaModel: process.env.RAG_EMBEDDING_MODEL || "nomic-embed-text",
  },
  chunker: {
    maxChunkChars: Number(process.env.RAG_CHUNK_MAX_CHARS || 700),
    overlapChars: Number(process.env.RAG_CHUNK_OVERLAP || 80),
  },
  retrieval: {
    topK: Number(process.env.RAG_TOP_K || 3),
    minSimilarity: Number(process.env.RAG_MIN_SIMILARITY || 0.32),
  },
  evaluation: {
    latencyTargetMs: Number(process.env.RAG_LATENCY_TARGET_MS || 1500),
  },
}));
