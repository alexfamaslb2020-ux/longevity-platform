import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import type {
  MessagingProvider,
  SendMessageInput,
  SendMessageResult,
  VerifyWebhookInput,
  MessagingEvent,
} from "./interfaces";

interface MockMessageInput {
  id?: string;
  from?: string;
  content?: string;
  text?: { body?: string };
}

@Injectable()
export class MockMessagingProvider implements MessagingProvider {
  readonly name = "mock";

  private readonly logger = new Logger(MockMessagingProvider.name);

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    this.logger.log(
      `[MOCK] Sending message to ${input.to}: "${input.text?.substring(0, 50)}..."`,
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      providerId: `mock_msg_${randomUUID()}`,
      status: "sent",
      timestamp: new Date().toISOString(),
      raw: { mock: true, to: input.to, textLength: input.text?.length },
    };
  }

  async verifyWebhook(_input: VerifyWebhookInput): Promise<boolean> {
    return true;
  }

  async parseWebhook(payload: unknown): Promise<MessagingEvent[]> {
    // Accept arbitrary payload as mock
    if (typeof payload === "object" && payload !== null) {
      const p = payload as Record<string, unknown>;
      const messages = Array.isArray(p.messages)
        ? (p.messages as MockMessageInput[])
        : [];
      if (p.messages || p.entry) {
        if (messages.length > 0) {
          // Simulate WhatsApp-like format with messages[]
          return messages.map((m) => ({
            id: m.id || randomUUID(),
            type: "message_received",
            from: m.from || "+351900000000",
            to: "+351900000001",
            content: m.text?.body || m.content || "Mock message",
            timestamp: new Date().toISOString(),
            raw: p,
          }));
        }
        // Simulate WhatsApp-like format (single message at top level)
        return [
          {
            id: randomUUID(),
            type: "message_received",
            from: (p.from as string) || "+351900000000",
            to: "+351900000001",
            content: (p.content as string) || "Mock message",
            timestamp: new Date().toISOString(),
            raw: p,
          },
        ];
      }
    }

    return [];
  }
}
