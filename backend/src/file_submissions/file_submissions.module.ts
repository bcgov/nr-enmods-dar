import { Module } from '@nestjs/common';
import { FileSubmissionsService } from './file_submissions.service';
import { FileSubmissionsController } from './file_submissions.controller';
import { SanitizeService } from 'src/sanitize/sanitize.service';

@Module({
  controllers: [FileSubmissionsController],
  providers: [FileSubmissionsService, SanitizeService],
  imports: []
})
export class FileSubmissionsModule {}
