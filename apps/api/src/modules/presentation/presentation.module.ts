import { Module } from "@nestjs/common";
import { PresentationController } from "./presentation.controller";
import { PresentationService } from "./presentation.service";
import { PrismaService } from "../../common/prisma.service";
import { DifyModule } from "../dify/dify.module";

@Module({
  imports: [DifyModule],
  controllers: [PresentationController],
  providers: [PresentationService, PrismaService],
  exports: [PresentationService],
})
export class PresentationModule {}
