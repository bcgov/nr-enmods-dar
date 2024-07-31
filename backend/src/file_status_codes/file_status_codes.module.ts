import { Module } from '@nestjs/common';
import { FileStatusCodesService } from './file_status_codes.service';
import { FileStatusCodesController } from './file_status_codes.controller';

@Module({
  controllers: [FileStatusCodesController],
  providers: [FileStatusCodesService],
})
export class FileStatusCodesModule {}
