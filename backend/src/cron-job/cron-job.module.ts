import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CronJobService } from './cron-job.service';
import { FileParseValidateModule } from '../file_parse_and_validation/file_parse_and_validation.module';
import { ObjectStoreModule } from '../objectStore/objectStore.module';

@Module({
  providers: [CronJobService],
  exports: [CronJobService],
  imports: [forwardRef(() => FileParseValidateModule), ObjectStoreModule],
})
export class CronJobModule {}
