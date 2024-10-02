import { Module } from "@nestjs/common";
import { FileSubmissionsService } from "./file_submissions.service";
import { FileSubmissionsController } from "./file_submissions.controller";
import { SanitizeService } from "src/sanitize/sanitize.service";
import { ObjectStoreModule } from "src/objectStore/objectStore.module";

@Module({
  controllers: [FileSubmissionsController],
  providers: [FileSubmissionsService, SanitizeService],
  exports: [FileSubmissionsService],
  imports: [ObjectStoreModule],
})
export class FileSubmissionsModule {}
