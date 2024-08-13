import { Test, TestingModule } from '@nestjs/testing';
import { FtpService } from './ftp.service';

describe('FtpService', () => {
  let service: FtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FtpService],
    }).compile();

    service = module.get<FtpService>(FtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
