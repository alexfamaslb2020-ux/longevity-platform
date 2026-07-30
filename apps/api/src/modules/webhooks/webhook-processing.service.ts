import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../common/prisma.service";
import { WebhookVerificationService } from "../../common/webhook-verification.service";
import { LogSanitizerService } from "../../common/log-sanitizer.service";

export interface WebhookEventInput {
  provider: string;
  externalEventId: string;
  eventType: string;
  rawBody: Buffer;
  organizationId?: string;
}

@Injectable()
export class WebhookProcessingService {
  private readonly logger = new Logger(WebhookProcessingService.name);

  constructor(
    @InjectQueue("webhooks") private readonly webhookQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly verification: WebhookVerificationService,
    private readonly sanitizer: LogSanitizerService,
  ) {}

  async handleWebhookEvent(input: WebhookEventInput): Promise<void> {
    const payloadHash = this.verification.hashPayload(input.rawBody);

    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: input.provider,
          externalEventId: input.externalEventId,
        },
      },
    });

    if (existing) {
      this.logger.warn(
        `Duplicate webhook event: ${input.provider}/${input.externalEventId} (status: ${existing.status})`,
      );
      if (existing.status === "COMPLETED" || existing.status === "PROCESSING") {
        return;
      }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const event = await this.prisma.webhookEvent.upsert({
      where: {
        provider_externalEventId: {
          provider: input.provider,
          externalEventId: input.externalEventId,
        },
      },
      update: {
        status: "PENDING",
        payloadHash,
        attempts: 0,
        lastError: null,
        expiresAt,
      },
      create: {
        provider: input.provider,
        externalEventId: input.externalEventId,
        eventType: input.eventType,
        payloadHash,
        organizationId:
          input.organizationId || "00000000-0000-0000-0000-000000000000",
        status: "PENDING",
        expiresAt,
      },
    });

    await this.webhookQueue.add(
      "process-webhook",
      {
        webhookEventId: event.id,
        provider: input.provider,
        eventType: input.eventType,
      },
      {
        jobId: event.id,
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  }

  async markCompleted(webhookEventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });
  }

  async markFailed(webhookEventId: string, error: string): Promise<void> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
    });
    const newAttempts = (event?.attempts || 0) + 1;
    const shouldFail = newAttempts >= 5;

    await this.prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: shouldFail ? "FAILED" : "PENDING",
        attempts: newAttempts,
        lastError: error.substring(0, 1000),
        processedAt: shouldFail ? new Date() : undefined,
      },
    });
  }

  async getDeadLetteredEvents(limit = 50) {
    return this.prisma.webhookEvent.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async retryEvent(webhookEventId: string): Promise<void> {
    await this.prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: "PENDING", attempts: 0, lastError: null },
    });
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.webhookEvent.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
