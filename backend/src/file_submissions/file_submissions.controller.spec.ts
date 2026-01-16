import { Test, TestingModule } from "@nestjs/testing";
import { FileSubmissionsController } from "./file_submissions.controller";
import { FileSubmissionsService } from "./file_submissions.service";
import { PrismaService } from "nestjs-prisma";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import { OperationLockService } from "src/operationLock/operationLock.service";
import { SanitizeService } from "src/sanitize/sanitize.service";

describe("FileSubmissionsController", () => {
  let controller: FileSubmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileSubmissionsController],
      providers: [
        FileSubmissionsService,
        { provide: PrismaService, useValue: {} },
        { provide: ObjectStoreService, useValue: {} },
        { provide: AqiApiService, useValue: {} },
        { provide: OperationLockService, useValue: {} },
        { provide: SanitizeService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FileSubmissionsController>(
      FileSubmissionsController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
