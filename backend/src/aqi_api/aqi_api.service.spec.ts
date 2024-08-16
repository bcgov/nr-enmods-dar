import { Test, TestingModule } from '@nestjs/testing';
import { AqiApiService } from './aqi_api.service';

describe('AqiApiService', () => {
  let service: AqiApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AqiApiService],
    }).compile();

    service = module.get<AqiApiService>(AqiApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
