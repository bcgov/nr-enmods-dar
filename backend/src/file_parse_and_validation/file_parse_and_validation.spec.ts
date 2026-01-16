import { Test, TestingModule } from "@nestjs/testing";
import { FileParseValidateService } from "./file_parse_and_validation.service";
import { PrismaService } from "nestjs-prisma";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import { NotificationsService } from "src/notifications/notifications.service";
import { CacheService } from "src/cache/cache.service";

describe("AqiApiService", () => {
  let service: FileParseValidateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileParseValidateService,
        { provide: PrismaService, useValue: {} },
        { provide: FileSubmissionsService, useValue: {} },
        { provide: AqiApiService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        {
          provide: CacheService,
          useValue: {
            findLocationByCustomId: jest.fn(),
            findProjectByCustomId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileParseValidateService>(FileParseValidateService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
