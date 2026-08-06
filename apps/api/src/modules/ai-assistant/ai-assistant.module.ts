import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { PrismaService } from "../../common/prisma.service";
import { AuditService } from "../../common/audit.service";
import { AiAssistantController } from "./ai-assistant.controller";
import { AiAssistantService } from "./ai-assistant.service";
import { EmbeddingService } from "./embedding.service";
import { ChunkerService } from "./chunker.service";
import { RetrievalService } from "./retrieval.service";
import { IntentService } from "./intent.service";
import { EvaluatorService } from "./evaluator.service";
import { ScheduleToolService } from "./schedule-tool.service";

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    EmbeddingService,
    ChunkerService,
    RetrievalService,
    IntentService,
    EvaluatorService,
    ScheduleToolService,
    PrismaService,
    AuditService,
  ],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
