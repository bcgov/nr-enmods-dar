import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { HttpService } from "@nestjs/axios";
import { FileErrorLogsService } from "src/file_error_logs/file_error_logs.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { AdminService } from "src/admin/admin.service";
import { PrismaService } from "nestjs-prisma";

describe("NotificationsService", () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: HttpService, useValue: {} },
        { provide: FileErrorLogsService, useValue: {} },
        { provide: FileSubmissionsService, useValue: {} },
        { provide: AdminService, useValue: {} },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
