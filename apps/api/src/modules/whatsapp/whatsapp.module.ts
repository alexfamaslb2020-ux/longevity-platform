import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { WhatsappController } from "./whatsapp.controller";
import { WhatsappService } from "./whatsapp.service";
import { PrismaService } from "../../common/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { ProvidersModule } from "../../providers/providers.module";

@Module({
  imports: [HttpModule, AuthModule, ProvidersModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
