import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { HttpModule } from "@nestjs/axios";
import { FileErrorLogsService } from "src/file_error_logs/file_error_logs.service";
import { FileSubmissionsModule } from "src/file_submissions/file_submissions.module";

@Module({
  imports: [HttpModule, FileSubmissionsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FileErrorLogsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
