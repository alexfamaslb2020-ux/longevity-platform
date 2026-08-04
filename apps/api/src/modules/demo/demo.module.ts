import { Module } from "@nestjs/common";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";
import { PrismaService } from "../../common/prisma.service";
import { AuditService } from "../../common/audit.service";
import { CrmModule } from "../crm/crm.module";
import { CheckinsModule } from "../checkins/checkins.module";
import { WhatsappModule } from "../whatsapp/whatsapp.module";
import { VoiceModule } from "../voice/voice.module";

@Module({
  imports: [CrmModule, CheckinsModule, WhatsappModule, VoiceModule],
  controllers: [DemoController],
  providers: [DemoService, PrismaService, AuditService],
  exports: [DemoService],
})
export class DemoModule {}
