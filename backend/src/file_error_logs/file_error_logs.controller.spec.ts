import { Test, TestingModule } from "@nestjs/testing";
import { FileErrorLogsController } from "./file_error_logs.controller";
import { FileErrorLogsService } from "./file_error_logs.service";
import { PrismaService } from "nestjs-prisma";

describe("FileErrorLogsController", () => {
  let controller: FileErrorLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileErrorLogsController],
      providers: [
        FileErrorLogsService,
        {
          provide: PrismaService,
          useValue: {
            file_error_log: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<FileErrorLogsController>(FileErrorLogsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
