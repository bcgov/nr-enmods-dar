import { Test, TestingModule } from "@nestjs/testing";
import { FileStatusCodesController } from "./file_status_codes.controller";
import { FileStatusCodesService } from "./file_status_codes.service";
import { PrismaService } from "nestjs-prisma";

describe("FileStatusCodesController", () => {
  let controller: FileStatusCodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileStatusCodesController],
      providers: [
        FileStatusCodesService,
        {
          provide: PrismaService,
          useValue: {
            submission_status_code: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<FileStatusCodesController>(
      FileStatusCodesController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
