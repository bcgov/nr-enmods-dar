import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ObjectStoreService } from './objectStore.service';

@Module({
  providers: [ObjectStoreService],
  exports: [ObjectStoreService],
  imports: [HttpModule],
})
export class ObjectStoreModule {}
