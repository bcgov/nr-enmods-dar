import { Test, TestingModule } from '@nestjs/testing';
import { DryrunController } from './dryrun.controller';
import { DryrunService } from './dryrun.service';

describe('DryrunController', () => {
  let controller: DryrunController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DryrunController],
      providers: [DryrunService],
    }).compile();

    controller = module.get<DryrunController>(DryrunController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
