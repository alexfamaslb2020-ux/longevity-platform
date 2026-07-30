import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MockMessagingProvider } from "./mock-messaging.provider";
import { MockVoiceProvider } from "./mock-voice.provider";
import type { MessagingProvider, VoiceProvider } from "./interfaces";

export const MESSAGING_PROVIDER = "MESSAGING_PROVIDER";
export const VOICE_PROVIDER = "VOICE_PROVIDER";

@Module({
  imports: [ConfigModule],
  providers: [
    MockMessagingProvider,
    MockVoiceProvider,
    {
      provide: MESSAGING_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockMessagingProvider,
      ): MessagingProvider => {
        const activeProvider = config.get<string>(
          "integrations.whatsapp.apiKey",
        )
          ? "whatsapp-cloud"
          : "mock";
        if (activeProvider === "mock") {
          return mock;
        }
        // WhatsApp Cloud provider would be instantiated here when configured
        return mock;
      },
      inject: [ConfigService, MockMessagingProvider],
    },
    {
      provide: VOICE_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockVoiceProvider,
      ): VoiceProvider => {
        const activeProvider = config.get<string>("integrations.vapi.apiKey")
          ? "vapi"
          : "mock";
        if (activeProvider === "mock") {
          return mock;
        }
        return mock;
      },
      inject: [ConfigService, MockVoiceProvider],
    },
  ],
  exports: [MESSAGING_PROVIDER, VOICE_PROVIDER],
})
export class ProvidersModule {}
