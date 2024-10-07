import { Test, TestingModule } from '@nestjs/testing';
import { FileErrorLogsService } from './file_error_logs.service';

describe('FileErrorLogsService', () => {
  let service: FileErrorLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileErrorLogsService],
    }).compile();

    service = module.get<FileErrorLogsService>(FileErrorLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
