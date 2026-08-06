-- RAG + AI Assistant: pgvector extension, knowledge base, tool calls, evaluations
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Knowledge documents (base de conhecimento) ───────────────────────────────
CREATE TABLE "knowledge_documents" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" uuid,
    "title" varchar(255) NOT NULL,
    "category" varchar(100) NOT NULL DEFAULT 'GENERAL',
    "content" text NOT NULL,
    "chunk_count" integer NOT NULL DEFAULT 0,
    "status" varchar(50) NOT NULL DEFAULT 'INGESTED',
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "knowledge_documents_org_idx" ON "knowledge_documents"("organization_id");

-- ── Chunks com embeddings (pgvector, cosine) ────────────────────────────────
CREATE TABLE "knowledge_chunks" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "document_id" uuid NOT NULL,
    "chunk_index" integer NOT NULL,
    "content" text NOT NULL,
    "token_count" integer NOT NULL DEFAULT 0,
    "embedding" vector(384),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "knowledge_chunks_doc_idx" ON "knowledge_chunks"("document_id");
CREATE INDEX "knowledge_chunks_embedding_idx" ON "knowledge_chunks"
    USING hnsw ("embedding" vector_cosine_ops);
ALTER TABLE "knowledge_chunks"
    ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id")
    REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Tool calls (function calling) ───────────────────────────────────────────
CREATE TABLE "tool_calls" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" uuid,
    "conversation_ref" varchar(100),
    "tool_name" varchar(100) NOT NULL,
    "args" json NOT NULL DEFAULT '{}',
    "status" varchar(50) NOT NULL DEFAULT 'PENDING',
    "result" json,
    "error" text,
    "confirmed_at" timestamp(3),
    "executed_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tool_calls_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tool_calls_org_idx" ON "tool_calls"("organization_id");
CREATE INDEX "tool_calls_status_idx" ON "tool_calls"("status");

-- ── Respostas da IA + avaliação ─────────────────────────────────────────────
CREATE TABLE "ai_responses" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" uuid,
    "query" text NOT NULL,
    "response" text NOT NULL,
    "intent" varchar(50) NOT NULL,
    "confidence" double precision NOT NULL DEFAULT 0,
    "grounded" boolean NOT NULL DEFAULT false,
    "refused" boolean NOT NULL DEFAULT false,
    "used_tool" boolean NOT NULL DEFAULT false,
    "tool_call_id" uuid,
    "latency_ms" integer NOT NULL DEFAULT 0,
    "sources" json NOT NULL DEFAULT '[]',
    "evaluation" json DEFAULT '{}',
    "evaluation_score" double precision NOT NULL DEFAULT 0,
    "model" varchar(100) NOT NULL DEFAULT 'local-rag-1',
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_responses_org_idx" ON "ai_responses"("organization_id");
CREATE INDEX "ai_responses_created_idx" ON "ai_responses"("created_at");
