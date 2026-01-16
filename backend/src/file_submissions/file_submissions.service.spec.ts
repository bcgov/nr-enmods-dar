import { Test, TestingModule } from "@nestjs/testing";
import { FileSubmissionsService } from "./file_submissions.service";
import { PrismaService } from "nestjs-prisma";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import { OperationLockService } from "src/operationLock/operationLock.service";

describe("FileSubmissionsService", () => {
  let service: FileSubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileSubmissionsService,
        { provide: PrismaService, useValue: {} },
        { provide: ObjectStoreService, useValue: {} },
        { provide: AqiApiService, useValue: {} },
        { provide: OperationLockService, useValue: {} },
      ],
    }).compile();

    service = module.get<FileSubmissionsService>(FileSubmissionsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
