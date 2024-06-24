import { Test, TestingModule } from '@nestjs/testing';
import { FileStatusCodesService } from './file_status_codes.service';

describe('FileStatusCodesService', () => {
  let service: FileStatusCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileStatusCodesService],
    }).compile();

    service = module.get<FileStatusCodesService>(FileStatusCodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
