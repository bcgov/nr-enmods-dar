import { Module } from "@nestjs/common";
import { SftpService } from "./sftp.service";
import { NotificationsModule } from "src/notifications/notifications.module";
import { FileValidationModule } from "src/file_validation/file_validation.module";
import { FileSubmissionsModule } from "src/file_submissions/file_submissions.module";

@Module({
  imports: [NotificationsModule, FileValidationModule, FileSubmissionsModule],
  providers: [SftpService],
})
export class SftpModule {}
