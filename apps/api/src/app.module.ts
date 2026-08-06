import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bullmq";

import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import redisConfig from "./config/redis.config";
import integrationsConfig from "./config/integrations.config";
import throttlerConfig from "./config/throttler.config";
import demoConfig from "./config/demo.config";
import aiAssistantConfig from "./config/ai-assistant.config";

import { AuthModule } from "./modules/auth/auth.module";
import { CrmModule } from "./modules/crm/crm.module";
import { PipelineModule } from "./modules/pipeline/pipeline.module";
import { WhatsappModule } from "./modules/whatsapp/whatsapp.module";
import { VoiceModule } from "./modules/voice/voice.module";
import { CheckinsModule } from "./modules/checkins/checkins.module";
import { HealthModule } from "./modules/health/health.module";
import { ProvidersModule } from "./providers/providers.module";
import { AutomationsModule } from "./modules/automation/automations.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { DemoModule } from "./modules/demo/demo.module";
import { ActivityModule } from "./modules/activity/activity.module";
import { DifyModule } from "./modules/dify/dify.module";
import { PresentationModule } from "./modules/presentation/presentation.module";
import { AiAssistantModule } from "./modules/ai-assistant/ai-assistant.module";

import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { ProductionValidationService } from "./common/production-validation.service";
import { WebhookVerificationService } from "./common/webhook-verification.service";
import { LogSanitizerService } from "./common/log-sanitizer.service";
import { PrismaService } from "./common/prisma.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        integrationsConfig,
        throttlerConfig,
        demoConfig,
        aiAssistantConfig,
      ],
      envFilePath: [".env", ".env.local"],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttler = configService.get("throttler");
        if (throttler?.disabled) {
          return { throttlers: [] };
        }
        return {
          throttlers: [
            { ttl: throttler.global.ttl, limit: throttler.global.limit },
          ],
        };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>("redis.url", "redis://localhost:6379"),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CrmModule,
    PipelineModule,
    WhatsappModule,
    VoiceModule,
    CheckinsModule,
    HealthModule,
    ProvidersModule,
    AutomationsModule,
    WebhooksModule,
    DemoModule,
    ActivityModule,
    DifyModule,
    PresentationModule,
    AiAssistantModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ProductionValidationService,
    WebhookVerificationService,
    LogSanitizerService,
    PrismaService,
  ],
})
export class AppModule {}
