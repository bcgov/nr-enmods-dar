import { Test, TestingModule } from "@nestjs/testing";
import { AqiApiService } from "./aqi_api.service";
import { PrismaService } from "nestjs-prisma";

describe("AqiApiService", () => {
  let service: AqiApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AqiApiService,
        {
          provide: PrismaService,
          useValue: {
            aqi_locations: { findMany: jest.fn(), findUnique: jest.fn() },
            aqi_projects: { findMany: jest.fn(), findUnique: jest.fn() },
            aqi_observed_properties: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            aqi_obs_status: { findMany: jest.fn(), findUnique: jest.fn() },
            aqi_analysis_methods: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AqiApiService>(AqiApiService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
