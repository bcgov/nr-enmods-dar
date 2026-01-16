import { Test, TestingModule } from "@nestjs/testing";
import { FileValidationService } from "./file_validation.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "nestjs-prisma";

describe("FileValidationService", () => {
  let service: FileValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileValidationService,
        { provide: NotificationsService, useValue: {} },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<FileValidationService>(FileValidationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
