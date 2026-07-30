import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../common/prisma.service";
import { VOICE_PROVIDER } from "../../providers/providers.module";
import type { VoiceProvider } from "../../providers/interfaces";
import { PromptService } from "./prompt.service";
import { CallDirection, CallStatus } from "@prisma/client";

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @Inject(VOICE_PROVIDER) private readonly voiceProvider: VoiceProvider,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly promptService: PromptService,
  ) {}

  private get apiKey(): string {
    return this.configService.get<string>("integrations.vapi.apiKey") || "";
  }

  private get assistantId(): string {
    return (
      this.configService.get<string>("integrations.vapi.assistantId") || ""
    );
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async makeCall(
    to: string,
    promptCategory: string,
    context?: Record<string, unknown>,
  ) {
    if (!this.apiKey || !this.assistantId) {
      const result = await this.voiceProvider.startCall({
        to,
        promptCategory,
        promptContext: context,
      });
      const call = await this.prisma.call.create({
        data: {
          direction: CallDirection.OUTBOUND,
          status: CallStatus.IN_PROGRESS,
          callSid: result.callId,
          toNumber: to,
          aiUsed: true,
          metadata: { promptCategory, providerId: result.providerId } as any,
          startedAt: new Date(),
        },
      });
      this.logger.log(
        `[Provider] Voice call initiated: ${call.id} -> ${to} via ${this.voiceProvider.name}`,
      );
      return call;
    }

    const prompt = await this.promptService.getPrompt(promptCategory, context);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          "https://api.vapi.ai/call",
          {
            assistant: {
              assistantId: this.assistantId,
              model: {
                provider: "openai",
                model: this.configService.get<string>(
                  "integrations.openai.model",
                ),
                messages: [{ role: "system", content: prompt.content }],
              },
            },
            phoneNumber: {
              type: "number",
              number: to,
            },
            metadata: {
              promptCategory,
              promptVersion: prompt.version,
              ...(context as Record<string, unknown>),
            },
          },
          { headers: this.headers },
        ),
      );

      // Create call record
      const call = await this.prisma.call.create({
        data: {
          direction: CallDirection.OUTBOUND,
          status: CallStatus.IN_PROGRESS,
          callSid: response.data.id,
          toNumber: to,
          aiUsed: true,
          metadata: {
            promptCategory,
            promptVersion: prompt.version,
            vapiCallId: response.data.id,
          } as any,
          startedAt: new Date(),
        },
      });

      this.logger.log(`Voice call initiated: ${call.id} -> ${to}`);
      return call;
    } catch (error: any) {
      this.logger.error(
        `Voice call error: ${error.message}`,
        error.response?.data,
      );
      throw new BadRequestException({
        code: "VOICE_CALL_ERROR",
        message: "Erro ao iniciar chamada",
        details: error.response?.data,
      });
    }
  }

  async handleWebhook(payload: any) {
    if (!this.apiKey) {
      const events = await this.voiceProvider.parseWebhook(payload);
      for (const event of events) {
        if (event.type === "call_completed" || event.type === "call_failed") {
          const call = await this.prisma.call.findFirst({
            where: { callSid: event.callId },
          });
          if (call) {
            await this.prisma.call.update({
              where: { id: call.id },
              data: { status: CallStatus.COMPLETED, endedAt: new Date() },
            });
          }
        }
      }
      return { status: "processed", via: "mock" };
    }

    const { message, call: callData } = payload;

    if (!callData?.id) return { status: "ignored" };

    const call = await this.prisma.call.findFirst({
      where: { callSid: callData.id },
    });

    if (!call) {
      this.logger.warn(`Call not found for webhook: ${callData.id}`);
      return { status: "not_found" };
    }

    const updates: Record<string, any> = {};

    if (callData.status) {
      const statusMap: Record<string, CallStatus> = {
        completed: CallStatus.COMPLETED,
        failed: CallStatus.FAILED,
        "no-answer": CallStatus.NO_ANSWER,
        busy: CallStatus.BUSY,
        cancelled: CallStatus.CANCELLED,
      };
      updates.status = statusMap[callData.status] || CallStatus.COMPLETED;

      if (callData.status === "completed" || callData.status === "failed") {
        updates.endedAt = new Date();
        updates.duration = callData.duration || 0;
      }
    }

    if (callData.endedAt) {
      updates.endedAt = new Date(callData.endedAt);
    }

    if (callData.duration) {
      updates.duration = callData.duration;
    }

    if (callData.transcript) {
      updates.transcriptUrl = callData.transcript;
    }

    if (callData.summary || message?.summary) {
      updates.summary = callData.summary || message.summary;
    }

    if (callData.transferredTo) {
      updates.transferredTo = callData.transferredTo;
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.call.update({
        where: { id: call.id },
        data: updates,
      });
    }

    // Update conversation summary if available
    if (call.conversationId && updates.summary) {
      await this.prisma.conversation.update({
        where: { id: call.conversationId },
        data: { summary: updates.summary },
      });
    }

    this.logger.log(`Voice call webhook processed: ${call.id}`);
    return { status: "processed" };
  }

  private validatePhoneNumber(phone: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(phone);
  }
}
