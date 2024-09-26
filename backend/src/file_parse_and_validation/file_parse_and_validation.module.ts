import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { FileParseValidateService } from "./file_parse_and_validation.service";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { NotificationsService } from "src/notifications/notifications.service";

@Module({
  providers: [
    FileParseValidateService,
    FileSubmissionsService,
    AqiApiService,
    NotificationsService,
  ],
  exports: [FileParseValidateService],
  imports: [HttpModule],
})
export class FileParseValidateModule {}
