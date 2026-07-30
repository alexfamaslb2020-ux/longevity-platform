import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface ValidationIssue {
  check: string;
  severity: "error" | "warning";
  message: string;
}

@Injectable()
export class ProductionValidationService {
  private readonly logger = new Logger(ProductionValidationService.name);

  constructor(private readonly configService: ConfigService) {}

  validate(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const nodeEnv = this.configService.get<string>(
      "app.nodeEnv",
      "development",
    );

    if (nodeEnv !== "production") return [];

    const jwtSecret = this.configService.get<string>("app.jwtSecret", "");
    if (
      !jwtSecret ||
      jwtSecret.length < 32 ||
      jwtSecret.includes("dev-") ||
      jwtSecret.includes("change-me")
    ) {
      issues.push({
        check: "JWT_SECRET",
        severity: "error",
        message: "JWT secret is weak, too short, or using a default value",
      });
    }

    const dbUrl = process.env.DATABASE_URL || "";
    if (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")) {
      issues.push({
        check: "DATABASE_URL",
        severity: "error",
        message: "Database points to localhost in production",
      });
    }

    const redisUrl = process.env.REDIS_URL || "";
    if (redisUrl.includes("localhost") || redisUrl.includes("127.0.0.1")) {
      issues.push({
        check: "REDIS_URL",
        severity: "error",
        message: "Redis points to localhost in production",
      });
    }

    const corsOrigin = this.configService.get<string>(
      "integrations.corsOrigin",
    );
    if (nodeEnv === "production" && (!corsOrigin || corsOrigin === "*")) {
      issues.push({
        check: "CORS",
        severity: "error",
        message: "CORS uses wildcard in production",
      });
    }

    if (process.env.WHATSAPP_PROVIDER === "mock") {
      issues.push({
        check: "WHATSAPP_PROVIDER",
        severity: "error",
        message: "WhatsApp mock provider is active in production",
      });
    }

    if (process.env.VOICE_PROVIDER === "mock") {
      issues.push({
        check: "VOICE_PROVIDER",
        severity: "error",
        message: "Voice mock provider is active in production",
      });
    }

    const whatsappSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (!whatsappSecret || whatsappSecret.length < 16) {
      issues.push({
        check: "WHATSAPP_WEBHOOK_SECRET",
        severity: "error",
        message: "Webhook secret is missing or too short",
      });
    }

    if (process.env.NODE_ENV === "production" && process.env.DEBUG === "true") {
      issues.push({
        check: "DEBUG",
        severity: "error",
        message: "Debug mode is enabled in production",
      });
    }

    if (!process.env.ENCRYPTION_KEY) {
      issues.push({
        check: "ENCRYPTION_KEY",
        severity: "error",
        message: "Encryption key is missing",
      });
    }

    if (process.env.RATE_LIMIT_DISABLED === "true") {
      issues.push({
        check: "RATE_LIMIT",
        severity: "error",
        message: "Rate limiting is disabled in production",
      });
    }

    if (!process.env.SENTRY_DSN) {
      issues.push({
        check: "SENTRY_DSN",
        severity: "warning",
        message: "Sentry DSN not configured",
      });
    }

    return issues;
  }

  exitOnErrors(): void {
    const issues = this.validate();
    const errors = issues.filter((i) => i.severity === "error");

    if (errors.length > 0) {
      this.logger.error("Production validation failed with errors:");
      for (const err of errors) {
        this.logger.error(`  [${err.check}] ${err.message}`);
      }
      this.logger.error("Application will not start in production mode.");
      process.exit(1);
    }

    const warnings = issues.filter((i) => i.severity === "warning");
    for (const warn of warnings) {
      this.logger.warn(`[${warn.check}] ${warn.message}`);
    }

    this.logger.log("Production validation passed");
  }
}
