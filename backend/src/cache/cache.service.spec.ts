import { Test, TestingModule } from "@nestjs/testing";
import { CacheService } from "./cache.service";
import { PrismaService } from "nestjs-prisma";

describe("CacheService", () => {
  let service: CacheService;
  let prismaMock: any;

  const mockLocations = [
    {
      aqi_locations_id: "1",
      custom_id: "LOC001",
      name: "Location 1",
    },
  ];

  const mockProjects = [
    {
      aqi_projects_id: "1",
      custom_id: "PROJ001",
      name: "Project 1",
    },
  ];

  const mockObservedProperties = [
    {
      aqi_observed_properties_id: "1",
      custom_id: "OBS001",
      description: "Property 1",
      result_type: "Numeric",
    },
  ];

  const mockObsStatus = [
    {
      aqi_obs_status_id: "1",
      status_url: "https://example.com/status",
      active_ind: true,
    },
  ];

  const mockAnalysisMethods = [
    {
      aqi_analysis_methods_id: "1",
      method_id: "METHOD001",
      method_name: "Method 1",
      method_context: "Context",
      custom_id: "METH001",
    },
  ];

  beforeEach(async () => {
    prismaMock = {
      aqi_locations: {
        findMany: jest.fn().mockResolvedValue(mockLocations),
      },
      aqi_projects: {
        findMany: jest.fn().mockResolvedValue(mockProjects),
      },
      aqi_observed_properties: {
        findMany: jest.fn().mockResolvedValue(mockObservedProperties),
      },
      aqi_obs_status: {
        findMany: jest.fn().mockResolvedValue(mockObsStatus),
      },
      aqi_analysis_methods: {
        findMany: jest.fn().mockResolvedValue(mockAnalysisMethods),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  describe("onModuleInit", () => {
    it("should initialize cache on module startup", async () => {
      await service.onModuleInit();
      expect(service.isInitialized()).toBe(true);
      expect(service.getLocations()).toEqual(mockLocations);
    });
  });

  describe("refreshCache", () => {
    it("should refresh all tables from database", async () => {
      await service.refreshCache();
      expect(prismaMock.aqi_locations.findMany).toHaveBeenCalled();
      expect(prismaMock.aqi_projects.findMany).toHaveBeenCalled();
      expect(prismaMock.aqi_observed_properties.findMany).toHaveBeenCalled();
      expect(prismaMock.aqi_obs_status.findMany).toHaveBeenCalled();
      expect(prismaMock.aqi_analysis_methods.findMany).toHaveBeenCalled();
    });
  });

  describe("getLocations", () => {
    it("should return all locations from cache", async () => {
      await service.refreshCache();
      const result = service.getLocations();
      expect(result).toEqual(mockLocations);
    });
  });

  describe("findLocationByCustomId", () => {
    it("should find location by custom_id", async () => {
      await service.refreshCache();
      const result = service.findLocationByCustomId("LOC001");
      expect(result).toEqual(mockLocations[0]);
    });

    it("should return undefined if location not found", async () => {
      await service.refreshCache();
      const result = service.findLocationByCustomId("NONEXISTENT");
      expect(result).toBeUndefined();
    });
  });

  describe("getProjects", () => {
    it("should return all projects from cache", async () => {
      await service.refreshCache();
      const result = service.getProjects();
      expect(result).toEqual(mockProjects);
    });
  });

  describe("findProjectByCustomId", () => {
    it("should find project by custom_id", async () => {
      await service.refreshCache();
      const result = service.findProjectByCustomId("PROJ001");
      expect(result).toEqual(mockProjects[0]);
    });
  });

  describe("getObservedProperties", () => {
    it("should return all observed properties from cache", async () => {
      await service.refreshCache();
      const result = service.getObservedProperties();
      expect(result).toEqual(mockObservedProperties);
    });
  });

  describe("observedPropertyExists", () => {
    it("should return true if observed property exists", async () => {
      await service.refreshCache();
      const result = service.observedPropertyExists("OBS001");
      expect(result).toBe(true);
    });

    it("should return false if observed property does not exist", async () => {
      await service.refreshCache();
      const result = service.observedPropertyExists("NONEXISTENT");
      expect(result).toBe(false);
    });
  });

  describe("getObsStatuses", () => {
    it("should return all observation statuses from cache", async () => {
      await service.refreshCache();
      const result = service.getObsStatuses();
      expect(result).toEqual(mockObsStatus);
    });
  });

  describe("getActiveObsStatus", () => {
    it("should return active observation status", async () => {
      await service.refreshCache();
      const result = service.getActiveObsStatus();
      expect(result).toEqual(mockObsStatus[0]);
    });
  });

  describe("getAnalysisMethods", () => {
    it("should return all analysis methods from cache", async () => {
      await service.refreshCache();
      const result = service.getAnalysisMethods();
      expect(result).toEqual(mockAnalysisMethods);
    });
  });

  describe("findAnalysisMethodByMethodId", () => {
    it("should find analysis method by method_id", async () => {
      await service.refreshCache();
      const result = service.findAnalysisMethodByMethodId("METHOD001");
      expect(result).toEqual(mockAnalysisMethods[0]);
    });
  });

  describe("analysisMethodExists", () => {
    it("should return true if analysis method exists", async () => {
      await service.refreshCache();
      const result = service.analysisMethodExists("METHOD001");
      expect(result).toBe(true);
    });

    it("should return false if analysis method does not exist", async () => {
      await service.refreshCache();
      const result = service.analysisMethodExists("NONEXISTENT");
      expect(result).toBe(false);
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", async () => {
      await service.refreshCache();
      const stats = service.getCacheStats();
      expect(stats).toEqual({
        initialized: true,
        locations: 1,
        projects: 1,
        observed_properties: 1,
        obs_status: 1,
        analysis_methods: 1,
      });
    });
  });
});
