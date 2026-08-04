import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DifyController } from "./dify.controller";
import { DifyService } from "./dify.service";

@Module({
  imports: [HttpModule],
  controllers: [DifyController],
  providers: [DifyService],
  exports: [DifyService],
})
export class DifyModule {}
