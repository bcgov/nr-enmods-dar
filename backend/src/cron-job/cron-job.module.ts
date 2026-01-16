import { forwardRef, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CronJobService } from "./cron-job.service";
import { FileParseValidateModule } from "../file_parse_and_validation/file_parse_and_validation.module";
import { ObjectStoreModule } from "../objectStore/objectStore.module";
import { CacheModule } from "../cache/cache.module";

@Module({
  providers: [CronJobService],
  exports: [CronJobService],
  imports: [FileParseValidateModule, ObjectStoreModule, CacheModule],
})
export class CronJobModule {}
