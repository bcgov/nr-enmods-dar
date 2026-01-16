import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "nestjs-prisma";
import { FileErrorLogsService } from "src/file_error_logs/file_error_logs.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { AdminService } from "src/admin/admin.service";
import { HttpService } from "@nestjs/axios";

describe("NotificationsController", () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: {} },
        { provide: FileErrorLogsService, useValue: {} },
        { provide: FileSubmissionsService, useValue: {} },
        { provide: AdminService, useValue: {} },
        { provide: HttpService, useValue: {} },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
