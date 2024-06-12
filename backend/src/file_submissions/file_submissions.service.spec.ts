import { Test, TestingModule } from '@nestjs/testing';
import { FileSubmissionsService } from './file_submissions.service';

describe('FileSubmissionsService', () => {
  let service: FileSubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSubmissionsService],
    }).compile();

    service = module.get<FileSubmissionsService>(FileSubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
