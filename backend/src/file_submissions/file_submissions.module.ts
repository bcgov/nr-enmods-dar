import { Module } from '@nestjs/common';
import { FileSubmissionsService } from './file_submissions.service';
import { FileSubmissionsController } from './file_submissions.controller';

@Module({
  controllers: [FileSubmissionsController],
  providers: [FileSubmissionsService],
})
export class FileSubmissionsModule {}
