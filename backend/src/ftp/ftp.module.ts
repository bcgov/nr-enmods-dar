import { Module } from "@nestjs/common";
// remove when EMSEDS-186 is merged as this will be done at App module level
import { ScheduleModule } from "@nestjs/schedule";
import { FtpService } from "./ftp.service";
import { FtpController } from "./ftp.controller";
import { FtpFileValidationService } from "./ftp_file_validation.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [FtpService, FtpFileValidationService],
  controllers: [FtpController],
})
export class FtpModule {}
