import { Module } from "@nestjs/common";
import { FileValidationService } from "./file_validation.service";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  providers: [FileValidationService],
  exports: [FileValidationService],
})
export class FileValidationModule {}
