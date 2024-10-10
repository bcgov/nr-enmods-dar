import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { HttpModule } from "@nestjs/axios";
import { FileErrorLogsModule } from "src/file_error_logs/file_error_logs.module";
import { FileSubmissionsModule } from "src/file_submissions/file_submissions.module";

@Module({
  imports: [HttpModule, FileErrorLogsModule, FileSubmissionsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
