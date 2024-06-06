import { Test, TestingModule } from '@nestjs/testing';
import { DryrunService } from './dryrun.service';

describe('DryrunService', () => {
  let service: DryrunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DryrunService],
    }).compile();

    service = module.get<DryrunService>(DryrunService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
