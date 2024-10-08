import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { HttpModule } from "@nestjs/axios";
import { FileErrorLogsService } from "src/file_error_logs/file_error_logs.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";

@Module({
  imports: [HttpModule, FileErrorLogsService, FileSubmissionsService],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
