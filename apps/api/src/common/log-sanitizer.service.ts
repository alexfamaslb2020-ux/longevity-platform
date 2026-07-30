import { Injectable } from "@nestjs/common";

const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "secret",
  "apiKey",
  "api_key",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "authorization",
  "cookie",
  "jwt",
  "token",
  "stripeKey",
  "stripe_secret",
  "encryptionKey",
  "encryption_key",
  "privateKey",
  "private_key",
]);

const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g,
  /\b[\d]{4}[\s-]?[\d]{4}[\s-]?[\d]{4}[\s-]?[\d]{4}\b/g,
];

@Injectable()
export class LogSanitizerService {
  sanitize(data: unknown, depth = 3): unknown {
    if (depth <= 0) return "[MAX_DEPTH]";
    if (typeof data !== "object" || data === null) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, depth - 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      if (SENSITIVE_FIELDS.has(key)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitize(value, depth - 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeString(value: string): string {
    let result = value;

    if (result.length > 1000) {
      result = result.substring(0, 1000) + "... [TRUNCATED]";
    }

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(result)) {
        result = result.replace(pattern, "[REDACTED]");
      }
    }

    const phonePattern = /\+\d{7,15}/g;
    result = result.replace(phonePattern, (match) => {
      if (match.length > 4) {
        return (
          match.substring(0, 2) + "****" + match.substring(match.length - 2)
        );
      }
      return "[REDACTED]";
    });

    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
    result = result.replace(emailPattern, "[REDACTED EMAIL]");

    return result;
  }
}
