import { registerAs } from "@nestjs/config";

export interface DemoFeatureFlags {
  voiceAI: boolean;
  clientPortal: boolean;
  whatsapp: boolean;
  automations: boolean;
  checkins: boolean;
  notifications: boolean;
}

export default registerAs("demo", () => ({
  mode: process.env.DEMO_MODE === "true",
  presentationMode: process.env.DEMO_PRESENTATION_MODE === "true",
  features: {
    voiceAI: process.env.FEATURE_VOICE_AI === "true",
    clientPortal: process.env.FEATURE_CLIENT_PORTAL === "true",
    whatsapp: process.env.FEATURE_WHATSAPP === "true",
    automations: process.env.FEATURE_AUTOMATIONS === "true",
    checkins: process.env.FEATURE_CHECKINS === "true",
    notifications: process.env.FEATURE_NOTIFICATIONS === "true",
  } as DemoFeatureFlags,
  providers: {
    whatsapp: process.env.WHATSAPP_PROVIDER || "mock",
    voice: process.env.VOICE_PROVIDER || "mock",
    messaging: process.env.MESSAGING_PROVIDER || "mock",
    payment: process.env.PAYMENT_PROVIDER || "mock",
  },
}));
