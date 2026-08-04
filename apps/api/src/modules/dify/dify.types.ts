export interface DifyChatMessageRequest {
  inputs?: Record<string, unknown>;
  query: string;
  response_mode?: "blocking" | "streaming";
  conversation_id?: string;
  user: string;
}

export interface DifyChatMessageResponse {
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface DifyWorkflowRunRequest {
  inputs: Record<string, unknown>;
  response_mode?: "blocking" | "streaming";
  user: string;
}

export interface DifyWorkflowRunResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: "succeeded" | "failed" | "stopped";
    outputs: Record<string, unknown>;
    error?: string;
    elapsed_time?: number;
    created_at?: number;
  };
}

export interface DifyApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}
