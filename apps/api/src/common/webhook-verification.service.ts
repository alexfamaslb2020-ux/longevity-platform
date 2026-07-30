import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface WebhookVerificationInput {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  timestamp?: string;
  signature?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
  eventId?: string;
}

@Injectable()
export class WebhookVerificationService {
  private readonly logger = new Logger(WebhookVerificationService.name);

  constructor(private readonly configService: ConfigService) {}

  verifyHmacSha256(
    input: WebhookVerificationInput,
    secret: string,
  ): WebhookVerificationResult {
    const signature =
      input.signature || (input.headers["x-hub-signature-256"] as string) || "";
    const timestamp =
      input.timestamp || (input.headers["x-hub-timestamp"] as string) || "";

    if (!signature || !timestamp) {
      return { valid: false, reason: "Missing signature or timestamp headers" };
    }

    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(now - ts) > 300) {
      return { valid: false, reason: "Timestamp outside tolerance window" };
    }

    const payload = `${timestamp}.${input.rawBody.toString("utf8")}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return { valid: false, reason: "Signature mismatch" };
    }

    return { valid: true };
  }

  generateSignature(
    payload: string,
    secret: string,
    timestamp?: string,
  ): string {
    const ts = timestamp || Math.floor(Date.now() / 1000).toString();
    const data = `${ts}.${payload}`;
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  hashPayload(rawBody: Buffer): string {
    return crypto.createHash("sha256").update(rawBody).digest("hex");
  }
}
