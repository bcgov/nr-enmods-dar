import { Test, TestingModule } from '@nestjs/testing';
import { FileParseValidateService } from './file_parse_and_validation.service';

describe('AqiApiService', () => {
  let service: FileParseValidateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileParseValidateService],
    }).compile();

    service = module.get<FileParseValidateService>(FileParseValidateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
