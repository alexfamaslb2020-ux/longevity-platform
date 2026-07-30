import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { WebhookProcessingService } from "./webhook-processing.service";
import { LogSanitizerService } from "../../common/log-sanitizer.service";

@Processor("webhooks")
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processing: WebhookProcessingService,
    private readonly sanitizer: LogSanitizerService,
  ) {
    super();
  }

  async process(
    job: Job<{ webhookEventId: string; provider: string; eventType: string }>,
  ): Promise<void> {
    const { webhookEventId, provider, eventType } = job.data;

    try {
      this.logger.log(
        `Processing webhook event ${webhookEventId} (${provider}/${eventType})`,
      );

      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });

      const event = await this.prisma.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });

      if (!event) {
        throw new UnrecoverableError(
          `Webhook event ${webhookEventId} not found`,
        );
      }

      await this.processing.markCompleted(webhookEventId);
      this.logger.log(`Webhook event ${webhookEventId} completed successfully`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error processing webhook";
      this.logger.error(`Webhook event ${webhookEventId} failed: ${message}`);

      const sanitized =
        typeof message === "string"
          ? message.substring(0, 1000)
          : "Unknown error";
      await this.processing.markFailed(webhookEventId, sanitized);

      const event = await this.prisma.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });
      if (event && event.attempts >= 5) {
        this.logger.warn(
          `Webhook event ${webhookEventId} exceeded max retries, moved to dead-letter`,
        );

        await this.prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            status: "FAILED",
            lastError: `Final failure after ${event.attempts} attempts: ${sanitized}`,
          },
        });
      }

      throw error;
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.log(`Webhook job ${job.id} completed`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    const attempts = job.attemptsMade;
    this.logger.warn(
      `Webhook job ${job.id} failed (attempt ${attempts}/5): ${error.message}`,
    );
  }
}
