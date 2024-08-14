import { Module } from '@nestjs/common';
import { FileSubmissionsService } from './file_submissions.service';
import { FileSubmissionsController } from './file_submissions.controller';
import { SanitizeService } from 'src/sanitize/sanitize.service';
import { AqiApiModule } from 'src/aqi_api/aqi_api.module';

@Module({
  controllers: [FileSubmissionsController],
  providers: [FileSubmissionsService, SanitizeService],
  imports: [AqiApiModule]
})
export class FileSubmissionsModule {}
