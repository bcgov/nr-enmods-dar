import { Module } from "@nestjs/common";
import { FtpService } from "./ftp.service";
import { FtpController } from "./ftp.controller";
import { FtpFileValidationService } from "./ftp_file_validation.service";

@Module({
  providers: [FtpService, FtpFileValidationService],
  controllers: [FtpController],
})
export class FtpModule {}
