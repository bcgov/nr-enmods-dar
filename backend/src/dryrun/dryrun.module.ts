import { Module } from '@nestjs/common';
import { DryrunService } from './dryrun.service';
import { DryrunController } from './dryrun.controller';

@Module({
  controllers: [DryrunController],
  providers: [DryrunService],
})
export class DryrunModule {}
