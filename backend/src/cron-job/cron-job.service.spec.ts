import { Test, TestingModule } from "@nestjs/testing";
import { CronJobService } from "./cron-job.service";
import { PrismaService } from "nestjs-prisma";
import { FileParseValidateService } from "src/file_parse_and_validation/file_parse_and_validation.service";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { OperationLockService } from "src/operationLock/operationLock.service";
import { CacheService } from "src/cache/cache.service";

describe("CronJobService", () => {
  let service: CronJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        { provide: PrismaService, useValue: {} },
        { provide: FileParseValidateService, useValue: {} },
        { provide: ObjectStoreService, useValue: {} },
        { provide: OperationLockService, useValue: {} },
        { provide: CacheService, useValue: { refreshCache: jest.fn() } },
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
