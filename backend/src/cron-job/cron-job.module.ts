import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CronJobService } from './cron-job.service';
import { FileParseValidateModule } from 'src/file_parse_and_validation/file_parse_and_validation.module';
import { ObjectStoreModule } from 'src/objectStore/objectStore.module';

@Module({
  providers: [CronJobService],
  exports: [CronJobService],
  imports: [FileParseValidateModule, ObjectStoreModule],
})
export class CronJobModule {}
