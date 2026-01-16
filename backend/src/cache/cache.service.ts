import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";

interface CacheData {
  aqi_locations: any[];
  aqi_projects: any[];
  aqi_observed_properties: any[];
  aqi_obs_status: any[];
  aqi_analysis_methods: any[];
}

/**
 * Cache service for reference tables that are periodically refreshed
 * Loads data into memory on application startup and during refresh cycles
 */
@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private cache: CacheData = {
    aqi_locations: [],
    aqi_projects: [],
    aqi_observed_properties: [],
    aqi_obs_status: [],
    aqi_analysis_methods: [],
  };
  private cacheInitialized = false;

  constructor(private prisma: PrismaService) {}

  /**
   * Initialize cache on module startup
   */
  async onModuleInit() {
    try {
      this.logger.log("Initializing in-memory cache for reference tables...");
      await this.refreshCache();
      this.cacheInitialized = true;
      this.logger.log("Cache initialization completed successfully");
    } catch (error) {
      this.logger.error("Failed to initialize cache on startup:", error);
      // Continue anyway - the cache will work but may be empty until refresh happens
      this.cacheInitialized = true;
    }
  }

  /**
   * Refresh all cached tables from the database
   * Called by cron job periodically
   */
  async refreshCache(): Promise<void> {
    try {
      this.logger.log("Refreshing cache from database...");

      const [locations, projects, observedProps, obsStatus, analysisMethods] =
        await Promise.all([
          this.prisma.aqi_locations.findMany(),
          this.prisma.aqi_projects.findMany(),
          this.prisma.aqi_observed_properties.findMany(),
          this.prisma.aqi_obs_status.findMany(),
          this.prisma.aqi_analysis_methods.findMany(),
        ]);

      this.cache.aqi_locations = locations || [];
      this.cache.aqi_projects = projects || [];
      this.cache.aqi_observed_properties = observedProps || [];
      this.cache.aqi_obs_status = obsStatus || [];
      this.cache.aqi_analysis_methods = analysisMethods || [];

      this.logger.log(
        `Cache refreshed: locations=${this.cache.aqi_locations.length}, ` +
          `projects=${this.cache.aqi_projects.length}, ` +
          `observed_properties=${this.cache.aqi_observed_properties.length}, ` +
          `obs_status=${this.cache.aqi_obs_status.length}, ` +
          `analysis_methods=${this.cache.aqi_analysis_methods.length}`,
      );
    } catch (error) {
      this.logger.error("Error refreshing cache:", error);
      throw error;
    }
  }

  /**
   * Get all locations from cache
   */
  getLocations(): any[] {
    return this.cache.aqi_locations;
  }

  /**
   * Find a location by custom_id in cache
   */
  findLocationByCustomId(customId: string): any {
    return this.cache.aqi_locations.find((loc) => loc.custom_id === customId);
  }

  /**
   * Find a location by ID in cache
   */
  findLocationById(id: string): any {
    return this.cache.aqi_locations.find((loc) => loc.aqi_locations_id === id);
  }

  /**
   * Get all projects from cache
   */
  getProjects(): any[] {
    return this.cache.aqi_projects;
  }

  /**
   * Find a project by custom_id in cache
   */
  findProjectByCustomId(customId: string): any {
    return this.cache.aqi_projects.find((proj) => proj.custom_id === customId);
  }

  /**
   * Find a project by ID in cache
   */
  findProjectById(id: string): any {
    return this.cache.aqi_projects.find((proj) => proj.aqi_projects_id === id);
  }

  /**
   * Get all observed properties from cache
   */
  getObservedProperties(): any[] {
    return this.cache.aqi_observed_properties;
  }

  /**
   * Find an observed property by custom_id in cache
   */
  findObservedPropertyByCustomId(customId: string): any {
    return this.cache.aqi_observed_properties.find(
      (op) => op.custom_id === customId,
    );
  }

  /**
   * Find an observed property by ID in cache
   */
  findObservedPropertyById(id: string): any {
    return this.cache.aqi_observed_properties.find(
      (op) => op.aqi_observed_properties_id === id,
    );
  }

  /**
   * Check if observed property exists by custom_id (returns boolean like databaseLookup)
   */
  observedPropertyExists(customId: string): boolean {
    return this.cache.aqi_observed_properties.some(
      (op) => op.custom_id === customId,
    );
  }

  /**
   * Get all observation statuses from cache
   */
  getObsStatuses(): any[] {
    return this.cache.aqi_obs_status;
  }

  /**
   * Get active observation status from cache
   */
  getActiveObsStatus(): any {
    return this.cache.aqi_obs_status.find(
      (status) => status.active_ind === true,
    );
  }

  /**
   * Find obs status by ID in cache
   */
  findObsStatusById(id: string): any {
    return this.cache.aqi_obs_status.find(
      (status) => status.aqi_obs_status_id === id,
    );
  }

  /**
   * Get all analysis methods from cache
   */
  getAnalysisMethods(): any[] {
    return this.cache.aqi_analysis_methods;
  }

  /**
   * Find analysis method by method_id in cache
   */
  findAnalysisMethodByMethodId(methodId: string): any {
    return this.cache.aqi_analysis_methods.find(
      (method) => method.method_id === methodId,
    );
  }

  /**
   * Find analysis method by custom_id in cache
   */
  findAnalysisMethodByCustomId(customId: string): any {
    return this.cache.aqi_analysis_methods.find(
      (method) => method.custom_id === customId,
    );
  }

  /**
   * Check if analysis method exists by method_id
   */
  analysisMethodExists(methodId: string): boolean {
    return this.cache.aqi_analysis_methods.some(
      (method) => method.method_id === methodId,
    );
  }

  /**
   * Check if cache is initialized
   */
  isInitialized(): boolean {
    return this.cacheInitialized;
  }

  /**
   * Get cache size/status
   */
  getCacheStats(): object {
    return {
      initialized: this.cacheInitialized,
      locations: this.cache.aqi_locations.length,
      projects: this.cache.aqi_projects.length,
      observed_properties: this.cache.aqi_observed_properties.length,
      obs_status: this.cache.aqi_obs_status.length,
      analysis_methods: this.cache.aqi_analysis_methods.length,
    };
  }
}
