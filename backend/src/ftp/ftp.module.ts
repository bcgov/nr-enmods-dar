import { Module } from "@nestjs/common";
import { FtpService } from "./ftp.service";
import { FtpController } from "./ftp.controller";
import { NotificationsModule } from "src/notifications/notifications.module";
import { FileValidationModule } from "src/file_validation/file_validation.module";
import { FileSubmissionsModule } from "src/file_submissions/file_submissions.module";

@Module({
  imports: [NotificationsModule, FileValidationModule, FileSubmissionsModule],
  providers: [FtpService],
  controllers: [FtpController],
})
export class FtpModule {}
