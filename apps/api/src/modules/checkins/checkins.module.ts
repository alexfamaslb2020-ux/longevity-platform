import { Module } from "@nestjs/common";
import { CheckinsController } from "./checkins.controller";
import { CheckinsService } from "./checkins.service";
import { PrismaService } from "../../common/prisma.service";
import { AutomationsModule } from "../automation/automations.module";

@Module({
  imports: [AutomationsModule],
  controllers: [CheckinsController],
  providers: [CheckinsService, PrismaService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
