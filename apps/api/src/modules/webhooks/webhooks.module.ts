import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { WebhookController } from "./webhook.controller";
import { WebhookProcessingService } from "./webhook-processing.service";
import { WebhookProcessor } from "./webhook.processor";
import { WebhookVerificationService } from "../../common/webhook-verification.service";
import { PrismaService } from "../../common/prisma.service";
import { LogSanitizerService } from "../../common/log-sanitizer.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "webhooks",
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 30000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [WebhookController],
  providers: [
    WebhookProcessingService,
    WebhookProcessor,
    WebhookVerificationService,
    PrismaService,
    LogSanitizerService,
  ],
  exports: [BullModule, WebhookProcessingService],
})
export class WebhooksModule {}
