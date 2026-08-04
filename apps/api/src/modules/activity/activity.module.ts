import { Module } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { TasksController } from "./tasks.controller";
import { AlertsController } from "./alerts.controller";
import { NotificationsController } from "./notifications.controller";
import { NotesController } from "./notes.controller";
import { HistoryController } from "./history.controller";
import { ActivityService } from "./activity.service";
import { PrismaService } from "../../common/prisma.service";

@Module({
  controllers: [
    ConversationsController,
    TasksController,
    AlertsController,
    NotificationsController,
    NotesController,
    HistoryController,
  ],
  providers: [ActivityService, PrismaService],
  exports: [ActivityService],
})
export class ActivityModule {}
