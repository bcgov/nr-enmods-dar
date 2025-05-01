import { Test, TestingModule } from "@nestjs/testing";
import { SftpService } from "./sftp.service";

describe("SftpService", () => {
  let service: SftpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SftpService],
    }).compile();

    service = module.get<SftpService>(SftpService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
