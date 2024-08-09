import { Test, TestingModule } from '@nestjs/testing';
import { FtpController } from './ftp.controller';

describe('FtpController', () => {
  let controller: FtpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FtpController],
    }).compile();

    controller = module.get<FtpController>(FtpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
