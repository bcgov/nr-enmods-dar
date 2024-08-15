import { Module } from "@nestjs/common";
import { FtpService } from "./ftp.service";
import { FtpController } from "./ftp.controller";
import { FtpFileValidationService } from "./ftp_file_validation.service";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  providers: [FtpService, FtpFileValidationService],
  controllers: [FtpController],
})
export class FtpModule {}
