import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Request } from "express";
import { WebhookProcessingService } from "./webhook-processing.service";
import { WebhookVerificationService } from "../../common/webhook-verification.service";
import { ConfigService } from "@nestjs/config";

@Controller("webhooks")
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookProcessing: WebhookProcessingService,
    private readonly verification: WebhookVerificationService,
    private readonly configService: ConfigService,
  ) {}

  @Post("whatsapp")
  @HttpCode(200)
  async receiveWhatsApp(
    @Req() req: Request,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      throw new BadRequestException("Raw body required");
    }

    if (req.headers["content-type"] !== "application/json") {
      throw new BadRequestException("Unsupported content type");
    }

    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > 1024 * 100) {
      throw new BadRequestException("Payload too large");
    }

    const secret = this.configService.get<string>(
      "integrations.whatsapp.webhookSecret",
    );
    if (secret) {
      const result = this.verification.verifyHmacSha256(
        {
          rawBody,
          headers,
          signature: headers["x-hub-signature-256"] as string,
          timestamp: headers["x-hub-timestamp"] as string,
        },
        secret,
      );
      if (!result.valid) {
        this.logger.warn(
          `Webhook signature verification failed: ${result.reason}`,
        );
        throw new BadRequestException(
          `Invalid webhook signature: ${result.reason}`,
        );
      }
    }

    const body = req.body;
    const externalId =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ||
      `wa-${Date.now()}`;
    const eventType = "message.received";

    await this.webhookProcessing.handleWebhookEvent({
      provider: "whatsapp",
      externalEventId: externalId,
      eventType,
      rawBody,
    });

    return { status: "ok" };
  }

  @Post("voice")
  @HttpCode(200)
  async receiveVoice(
    @Req() req: Request,
    @Headers() _headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      throw new BadRequestException("Raw body required");
    }

    if (req.headers["content-type"] !== "application/json") {
      throw new BadRequestException("Unsupported content type");
    }

    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > 1024 * 100) {
      throw new BadRequestException("Payload too large");
    }

    const body = req.body;
    const externalId = body?.call_id || body?.id || `voice-${Date.now()}`;
    const eventType = "call.completed";

    await this.webhookProcessing.handleWebhookEvent({
      provider: "voice",
      externalEventId: externalId,
      eventType,
      rawBody,
    });

    return { status: "ok" };
  }
}
