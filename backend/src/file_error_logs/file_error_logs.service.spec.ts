import { Test, TestingModule } from "@nestjs/testing";
import { FileErrorLogsService } from "./file_error_logs.service";
import { PrismaService } from "nestjs-prisma";

describe("FileErrorLogsService", () => {
  let service: FileErrorLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileErrorLogsService,
        {
          provide: PrismaService,
          useValue: {
            file_error_log: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FileErrorLogsService>(FileErrorLogsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
