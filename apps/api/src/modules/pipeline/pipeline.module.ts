import { Module } from "@nestjs/common";
import { PipelineController } from "./pipeline.controller";
import { PipelineService } from "./pipeline.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
  controllers: [PipelineController],
  providers: [PipelineService, PrismaService],
  exports: [PipelineService],
})
export class PipelineModule {}
