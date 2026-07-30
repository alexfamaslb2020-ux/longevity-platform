import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";
import { PromptService } from "./prompt.service";
import { PrismaService } from "../../common/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { ProvidersModule } from "../../providers/providers.module";

@Module({
  imports: [HttpModule, AuthModule, ProvidersModule],
  controllers: [VoiceController],
  providers: [VoiceService, PromptService, PrismaService],
  exports: [VoiceService, PromptService],
})
export class VoiceModule {}
