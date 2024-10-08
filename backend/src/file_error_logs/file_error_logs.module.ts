import { Module } from "@nestjs/common";
import { FileErrorLogsService } from "./file_error_logs.service";
import { FileErrorLogsController } from "./file_error_logs.controller";

@Module({
  exports: [FileErrorLogsService],
  controllers: [FileErrorLogsController],
  providers: [FileErrorLogsService],
})
export class FileErrorLogsModule {}
