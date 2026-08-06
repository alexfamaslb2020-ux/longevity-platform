export type AgentIntent =
  | "greeting"
  | "appointment"
  | "pricing"
  | "checkin"
  | "program"
  | "faq"
  | "question"
  | "unknown";

export interface IntentResult {
  intent: AgentIntent;
  confidence: number;
  normalized: string;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

export interface SourceRef {
  documentId: string;
  title: string;
  category: string;
  chunkId: string;
  similarity: number;
  excerpt: string;
}

export interface SlotInfo {
  start: string; // ISO 8601
  label: string; // "Seg 10 de Ago às 10:00"
}

export type ToolCallStatus =
  "PENDING" | "CONFIRMED" | "EXECUTED" | "REJECTED" | "FAILED";

export interface ToolCallRecord {
  id: string;
  toolName: string;
  status: ToolCallStatus;
  args: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  error?: string | null;
}

export interface EvaluationCriterion {
  name: string;
  passed: boolean;
  reason: string;
}

export interface EvaluationResult {
  score: number; // 0-100
  criteria: EvaluationCriterion[];
}

export interface AgentResult {
  aiResponseId: string;
  query: string;
  response: string;
  intent: AgentIntent;
  confidence: number;
  grounded: boolean;
  refused: boolean;
  usedTool: boolean;
  toolCall?: ToolCallRecord | null;
  sources: SourceRef[];
  evaluation: EvaluationResult;
  latencyMs: number;
  proposedSlots?: SlotInfo[];
}

export interface ChatRequest {
  query: string;
  leadId?: string;
  phone?: string;
  conversationRef?: string;
}

export interface DocumentPayload {
  title: string;
  category?: string;
  content: string;
}
