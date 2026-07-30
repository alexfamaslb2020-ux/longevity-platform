export interface SendMessageInput {
  to: string;
  text: string;
  templateName?: string;
  templateParams?: Record<string, string>[];
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  providerId: string;
  status: "sent" | "failed" | "queued";
  timestamp: string;
  raw?: Record<string, unknown>;
}

export interface MessagingEvent {
  id: string;
  type:
    | "message_received"
    | "message_sent"
    | "message_failed"
    | "delivery_confirmed"
    | "read";
  from: string;
  to: string;
  content: string;
  timestamp: string;
  raw?: Record<string, unknown>;
}

export interface VerifyWebhookInput {
  signature?: string;
  body: unknown;
  headers: Record<string, string>;
  timestamp?: string;
}

export interface MessagingProvider {
  readonly name: string;
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<boolean>;
  parseWebhook(payload: unknown): Promise<MessagingEvent[]>;
}

export interface StartCallInput {
  to: string;
  promptCategory: string;
  promptContext?: Record<string, unknown>;
  from?: string;
  metadata?: Record<string, unknown>;
}

export interface StartCallResult {
  providerId: string;
  callId: string;
  status: "initiated" | "failed" | "queued";
  timestamp: string;
  raw?: Record<string, unknown>;
}

export interface VoiceCall {
  id: string;
  providerCallId: string;
  status: string;
  duration?: number;
  transcript?: string;
  summary?: string;
  transferredTo?: string;
  endedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface VoiceEvent {
  id: string;
  type:
    | "call_started"
    | "call_completed"
    | "call_failed"
    | "call_no_answer"
    | "call_transferred"
    | "transcript_ready";
  callId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface VoiceProvider {
  readonly name: string;
  startCall(input: StartCallInput): Promise<StartCallResult>;
  getCall(callId: string): Promise<VoiceCall>;
  verifyWebhook(input: VerifyWebhookInput): Promise<boolean>;
  parseWebhook(payload: unknown): Promise<VoiceEvent[]>;
}
