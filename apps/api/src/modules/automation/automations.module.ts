import { Module } from "@nestjs/common";
import { AutomationService } from "./automation.service";
import { EventPublisherService } from "./event-publisher.service";
import { WorkflowMatcherService } from "./workflow-matcher.service";
import { ConditionEvaluatorService } from "./condition-evaluator.service";
import { ActionExecutorService } from "./action-executor.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
  providers: [
    AutomationService,
    EventPublisherService,
    WorkflowMatcherService,
    ConditionEvaluatorService,
    ActionExecutorService,
    PrismaService,
  ],
  exports: [AutomationService, EventPublisherService],
})
export class AutomationsModule {}
