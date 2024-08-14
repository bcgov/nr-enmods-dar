import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AqiApiService } from './aqi_api.service';

@Module({
  imports: [HttpModule],
  providers: [AqiApiService],
  exports: [AqiApiService],
})
export class AqiApiModule {}
