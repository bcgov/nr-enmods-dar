import { Test, TestingModule } from "@nestjs/testing";
import { FileStatusCodesService } from "./file_status_codes.service";
import { PrismaService } from "nestjs-prisma";

describe("FileStatusCodesService", () => {
  let service: FileStatusCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStatusCodesService,
        {
          provide: PrismaService,
          useValue: {
            submission_status_code: {
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

    service = module.get<FileStatusCodesService>(FileStatusCodesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
