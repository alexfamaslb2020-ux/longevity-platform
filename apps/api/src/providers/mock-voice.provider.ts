import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import type {
  VoiceProvider,
  StartCallInput,
  StartCallResult,
  VoiceCall,
  VerifyWebhookInput,
  VoiceEvent,
} from "./interfaces";

@Injectable()
export class MockVoiceProvider implements VoiceProvider {
  readonly name = "mock";

  private readonly logger = new Logger(MockVoiceProvider.name);
  private calls = new Map<string, { status: string; startedAt: Date }>();

  async startCall(input: StartCallInput): Promise<StartCallResult> {
    const callId = randomUUID();
    this.logger.log(
      `[MOCK] Starting voice call to ${input.to} (prompt: ${input.promptCategory})`,
    );

    this.calls.set(callId, { status: "initiated", startedAt: new Date() });

    // Simulate async completion after 2 seconds
    setTimeout(() => {
      const call = this.calls.get(callId);
      if (call) {
        call.status = "completed";
        this.logger.log(`[MOCK] Call ${callId} completed`);
      }
    }, 2000);

    return {
      providerId: `mock_call_${callId}`,
      callId,
      status: "initiated",
      timestamp: new Date().toISOString(),
      raw: { mock: true, to: input.to, promptCategory: input.promptCategory },
    };
  }

  async getCall(callId: string): Promise<VoiceCall> {
    const call = this.calls.get(callId);
    if (!call) {
      return {
        id: callId,
        providerCallId: callId,
        status: "not_found",
      };
    }

    return {
      id: callId,
      providerCallId: callId,
      status: call.status,
      duration: call.status === "completed" ? 180 : undefined,
      summary:
        call.status === "completed"
          ? "Mock call: cliente demonstrou interesse no programa de longevidade."
          : undefined,
      metadata: { mock: true },
    };
  }

  async verifyWebhook(_input: VerifyWebhookInput): Promise<boolean> {
    return true;
  }

  async parseWebhook(payload: unknown): Promise<VoiceEvent[]> {
    if (typeof payload === "object" && payload !== null) {
      const p = payload as Record<string, unknown>;
      const callObj = p.call as Record<string, unknown> | undefined;
      const callId = (callObj?.id || p.callId) as string | undefined;
      if (callId) {
        return [
          {
            id: randomUUID(),
            type: "call_completed",
            callId,
            timestamp: new Date().toISOString(),
            data: p as Record<string, unknown>,
          },
        ];
      }
    }

    return [];
  }
}
