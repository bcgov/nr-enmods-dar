import { Module } from "@nestjs/common";
import { FileSubmissionsService } from "./file_submissions.service";
import { FileSubmissionsController } from "./file_submissions.controller";
import { SanitizeService } from "../sanitize/sanitize.service";
import { ObjectStoreModule } from "../objectStore/objectStore.module";
import { AqiApiModule } from "../aqi_api/aqi_api.module";
import { OperationLockService } from "src/operationLock/operationLock.service";

@Module({
  controllers: [FileSubmissionsController],
  providers: [FileSubmissionsService, SanitizeService, OperationLockService],
  exports: [FileSubmissionsService],
  imports: [ObjectStoreModule, AqiApiModule],
})
export class FileSubmissionsModule {}
