import { registerAs } from "@nestjs/config";

export default registerAs("integrations", () => ({
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v18.0",
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
  },
  vapi: {
    apiKey: process.env.VAPI_API_KEY,
    assistantId: process.env.VAPI_ASSISTANT_ID,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.LLM_MODEL || "gpt-4o",
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || "noreply@longevity.pt",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
}));
