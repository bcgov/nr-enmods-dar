import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from "@nestjs/axios";
import { FileParseValidateService } from "./file_parse_and_validation.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { ObjectStoreModule } from "src/objectStore/objectStore.module";
import { AqiApiModule } from '../aqi_api/aqi_api.module';
import { FileSubmissionsModule } from '../file_submissions/file_submissions.module';
import { OperationLockService } from 'src/operationLock/operationLock.service';
import { FileErrorLogsService } from 'src/file_error_logs/file_error_logs.service';

@Module({
  providers: [
    FileParseValidateService,
    NotificationsService,
    OperationLockService,
    FileErrorLogsService
  ],
  exports: [FileParseValidateService],
  imports: [HttpModule, FileSubmissionsModule, ObjectStoreModule, AqiApiModule],
})
export class FileParseValidateModule {}
