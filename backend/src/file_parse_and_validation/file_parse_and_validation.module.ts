import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FileParseValidateService } from './file_parse_and_validation.service';
import { AqiApiService } from 'src/aqi_api/aqi_api.service';
import { FileSubmissionsService } from 'src/file_submissions/file_submissions.service';
import { ObjectStoreModule } from 'src/objectStore/objectStore.module';
import { AqiApiModule } from 'src/aqi_api/aqi_api.module';
import { FileSubmissionsModule } from 'src/file_submissions/file_submissions.module';

@Module({
  providers: [FileParseValidateService, ],
  exports: [FileParseValidateService],
  imports: [HttpModule, FileSubmissionsModule, ObjectStoreModule, AqiApiModule]
})
export class FileParseValidateModule {}
