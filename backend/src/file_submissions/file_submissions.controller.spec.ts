import { Test, TestingModule } from '@nestjs/testing';
import { FileSubmissionsController } from './file_submissions.controller';
import { FileSubmissionsService } from './file_submissions.service';

describe('FileSubmissionsController', () => {
  let controller: FileSubmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileSubmissionsController],
      providers: [FileSubmissionsService],
    }).compile();

    controller = module.get<FileSubmissionsController>(FileSubmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
