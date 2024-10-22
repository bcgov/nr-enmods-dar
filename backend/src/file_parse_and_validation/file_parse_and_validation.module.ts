import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FileParseValidateService } from './file_parse_and_validation.service';
import { ObjectStoreModule } from '../objectStore/objectStore.module';
import { AqiApiModule } from '../aqi_api/aqi_api.module';
import { FileSubmissionsModule } from '../file_submissions/file_submissions.module';

@Module({
  providers: [FileParseValidateService, ],
  exports: [FileParseValidateService],
  imports: [HttpModule, forwardRef(() => FileSubmissionsModule), ObjectStoreModule, forwardRef(() => AqiApiModule)]
})
export class FileParseValidateModule {}
