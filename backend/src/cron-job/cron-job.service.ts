import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "nestjs-prisma";
import { FileParseValidateService } from "src/file_parse_and_validation/file_parse_and_validation.service";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { OperationLockService } from "src/operationLock/operationLock.service";
import * as fs from "fs";
import path from "path";

/**
 * Cron Job service for filling code tables with data from AQI API
 */
@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  private tableModels;
  private isProcessing = false;

  private dataPullDownComplete: boolean = false;
  // Track the last hour when pulldown was performed
  private lastPulldownHour: number | null = null;
  constructor(
    private prisma: PrismaService,
    private readonly fileParser: FileParseValidateService,
    private readonly objectStore: ObjectStoreService,
    private readonly operationLockService: OperationLockService,
  ) {
    this.tableModels = new Map<string, any>([
      ["aqi_projects", this.prisma.aqi_projects],
      ["aqi_mediums", this.prisma.aqi_mediums],
      ["aqi_collection_methods", this.prisma.aqi_collection_methods],
      ["aqi_analysis_methods", this.prisma.aqi_analysis_methods],
      ["aqi_extended_attributes", this.prisma.aqi_extended_attributes],
      ["aqi_context_tags", this.prisma.aqi_context_tags],
      ["aqi_laboratories", this.prisma.aqi_laboratories],
      ["aqi_observed_properties", this.prisma.aqi_observed_properties],
      ["aqi_detection_conditions", this.prisma.aqi_detection_conditions],
      ["aqi_result_status", this.prisma.aqi_result_status],
      ["aqi_result_grade", this.prisma.aqi_result_grade],
      ["aqi_tissue_types", this.prisma.aqi_tissue_types],
      ["aqi_sampling_agency", this.prisma.aqi_sampling_agency],
      ["aqi_locations", this.prisma.aqi_locations],
      ["aqi_units", this.prisma.aqi_units],
    ]);
  }

  private apisToCall = [
    {
      endpoint: "/v1/projects",
      method: "GET",
      dbTable: "aqi_projects",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/mediums",
      method: "GET",
      dbTable: "aqi_mediums",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/collectionmethods",
      method: "GET",
      dbTable: "aqi_collection_methods",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/analysismethods",
      method: "GET",
      dbTable: "aqi_analysis_methods",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/extendedattributes",
      method: "GET",
      dbTable: "aqi_extended_attributes",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/tags",
      method: "GET",
      dbTable: "aqi_context_tags",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/laboratories",
      method: "GET",
      dbTable: "aqi_laboratories",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/observedproperties",
      method: "GET",
      dbTable: "aqi_observed_properties",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/detectionconditions",
      method: "GET",
      dbTable: "aqi_detection_conditions",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/resultstatuses",
      method: "GET",
      dbTable: "aqi_result_status",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/resultgrades",
      method: "GET",
      dbTable: "aqi_result_grade",
      paramsEnabled: false,
    },
    {
      endpoint:
        "/v1/extendedattributes/6f7d5be0-f91a-4353-9d31-13983205cbe0/dropdownlistitems",
      method: "GET",
      dbTable: "aqi_tissue_types",
      paramsEnabled: false,
    },
    {
      endpoint:
        "/v1/extendedattributes/65d94fac-aac5-498f-bc73-b63a322ce350/dropdownlistitems",
      method: "GET",
      dbTable: "aqi_sampling_agency",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/samplinglocations",
      method: "GET",
      dbTable: "aqi_locations",
      paramsEnabled: true,
    },
    {
      endpoint: "/v1/units",
      method: "GET",
      dbTable: "aqi_units",
      paramsEnabled: true,
    },
  ];

  private async updateDatabase(dbTable: string, data: any, batchSize = 1000) {
    const startTime = new Date().getTime();
    try {
      const model = this.tableModels.get(dbTable);
      if (!model) throw new Error(`Unknown dbTable: ${dbTable}`);
      this.logger.log(
        `Upserting ${data.length} entries into ${dbTable} in batches of ${batchSize}...`,
      );

      // Process data in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        await this.prisma.$transaction(
          batch.map((record) =>
            model.upsert({
              where: { [`${dbTable}_id`]: record.id },
              update: this.getUpdatePayload(dbTable, record),
              create: this.getCreatePayload(dbTable, record),
            }),
          ),
        );

        this.logger.log(
          `Processed batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(data.length / batchSize)} for ${dbTable}`,
        );
      }
      this.logger.log(
        `Successfully upserted ${data.length} entries into ${dbTable} in ${(new Date().getTime() - startTime) / 1000} seconds`,
      );
    } catch (err) {
      this.logger.error(`Error updating #### ${dbTable} #### table`, err);
    }
  }

  /**
   * Returns the payload for the `update` operation based on the table.
   */
  private getUpdatePayload(dbTable: string, record: any): any {
    switch (dbTable) {
      case "aqi_tissue_types":
        return {
          aqi_tissue_types_id: record.id,
          custom_id: record.customId,
          create_user_id: "EnMoDS",
          create_utc_timestamp: record.creationTime,
          update_user_id: "EnMoDS",
          update_utc_timestamp: record.modificationTime,
        };
      case "aqi_sampling_agency":
        return {
          aqi_sampling_agency_id: record.id,
          custom_id: record.customId,
          create_user_id: "EnMoDS",
          create_utc_timestamp: record.creationTime,
          update_user_id: "EnMoDS",
          update_utc_timestamp: record.modificationTime,
        };
      case "aqi_analysis_methods":
        return {
          method_id: record.methodId,
          method_name: record.name,
          method_context: record.context,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
      case "aqi_observed_properties":
        return {
          custom_id: record.customId || record.name,
          description: record.description,
          result_type: record.resultType,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
      case "aqi_units":
        return {
          aqi_units_id: record.id,
          custom_id: record.customId,
          name: record.name,
          edt_unit: record.edt_unit,
          create_user_id: "EnMoDS",
          create_utc_timestamp: record.creationTime,
          update_user_id: "EnMoDS",
          update_utc_timestamp: record.modificationTime,
        };
      default:
        return {
          custom_id: record.customId || record.name,
          description: record.description,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
    }
  }

  /**
   * Returns the payload for the `create` operation based on the table.
   */
  private getCreatePayload(dbTable: string, record: any): any {
    switch (dbTable) {
      case "aqi_tissue_types":
        return {
          aqi_tissue_types_id: record.id,
          custom_id: record.customId,
          create_user_id: "EnMoDS",
          create_utc_timestamp: new Date(),
          update_user_id: "EnMoDS",
          update_utc_timestamp: new Date(),
        };
      case "aqi_sampling_agency":
        return {
          aqi_sampling_agency_id: record.id,
          custom_id: record.customId,
          create_user_id: "EnMoDS",
          create_utc_timestamp: new Date(),
          update_user_id: "EnMoDS",
          update_utc_timestamp: new Date(),
        };
      case "aqi_analysis_methods":
        return {
          [`${dbTable}_id`]: record.id,
          method_id: record.methodId,
          method_name: record.name,
          method_context: record.context,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
      case "aqi_observed_properties":
        return {
          aqi_observed_properties_id: record.id,
          custom_id: record.customId || record.name,
          description: record.description,
          result_type: record.resultType,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
      case "aqi_units":
        return {
          aqi_units_id: record.id,
          custom_id: record.customId,
          name: record.name,
          edt_unit: record.edt_unit,
          create_user_id: "EnMoDS",
          create_utc_timestamp: record.creationTime,
          update_user_id: "EnMoDS",
          update_utc_timestamp: record.modificationTime,
        };
      default:
        return {
          [`${dbTable}_id`]: record.id,
          custom_id: record.customId || record.name,
          description: record.description,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
    }
  }

  // Maintenance window state
  private maintenanceWindowActive = false;

  // Cron: Midnight every day
  @Cron(process.env.MAINTENANCE_WINDOW) // every day at midnight
  private async maintenanceWindow() {
    this.maintenanceWindowActive = true;
    this.logger.log("Maintenance window started at midnight.");
    let refreshStarted = false;
    let refreshCompleted = false;
    const deadline = new Date();
    deadline.setHours(parseInt(process.env.MAINTENANCE_WINDOW_DEADLINE) || 4, 0, 0, 0); // 4:00 AM today

    // Wait for FILE_PROCESSING to finish if running
    while (
      this.operationLockService.getCurrentLock() === "FILE_PROCESSING" &&
      new Date() < deadline
    ) {
      this.logger.log("Waiting for FILE_PROCESSING to finish before REFRESH.");
      await new Promise((resolve) => setTimeout(resolve, 60000)); // wait 1 minute
    }

    // Try to acquire REFRESH lock
    if (this.operationLockService.acquireLock("REFRESH")) {
      refreshStarted = true;
      try {
        this.logger.log(`Starting the database drop and replace`);
        for (const api of this.apisToCall) {
          this.logger.log(`Deleting all rows for table ${api.dbTable}`);
          await this.prisma.$executeRawUnsafe(
            `TRUNCATE TABLE "${api.dbTable}" RESTART IDENTITY CASCADE`,
          );
          this.logger.log(
            `Successfully deleted all rows for table ${api.dbTable}`,
          );
        }
        this.logger.log(`Successfully deleted all pull down data`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 5 seconds
        this.logger.log(`Calling pulldown procedure now.`);
        await this.fetchAQSSData();
        this.logger.log(`Successfully refreshed all database tables`);
        refreshCompleted = true;
      } catch (err) {
        this.logger.error(`Error in REFRESH procedure:`, err);
      } finally {
        this.operationLockService.releaseLock("REFRESH");
        this.maintenanceWindowActive = false;
        this.logger.log("Maintenance window ended after REFRESH.");
      }
    } else {
      this.logger.warn(
        "REFRESH lock not acquired by 4am. Skipping drop and replace.",
      );
      this.maintenanceWindowActive = false;
      this.logger.log("Maintenance window ended (REFRESH skipped).");
    }
  }

  private async fetchAQSSData() {
    if (this.operationLockService.getCurrentLock() === "REFRESH") {
      this.logger.log("Releaseing REFRESH lock to allow pulldown of new data.");
      this.operationLockService.releaseLock("REFRESH");
    }

    // if (!this.operationLockService.acquireLock("PULLDOWN")) {
    //   this.logger.log(
    //     "Skipping cron procedure of data pull down: Another process underway.",
    //   );
    //   return;
    // }

    this.logger.log(`Starting Code Table Cron Job`);
    axios.defaults.method = "GET";
    axios.defaults.headers.common["Authorization"] =
      "token " + process.env.AQI_ACCESS_TOKEN;
    axios.defaults.headers.common["x-api-key"] = process.env.AQI_ACCESS_TOKEN;

    const baseUrl = process.env.AQI_BASE_URL;

    try {
      for (const api of this.apisToCall) {
        this.logger.log(`Getting data from ${api.endpoint}`);
        let cursor = "";
        let total = 0;
        let processedCount = 0;
        let loopCount = 0;

        do {
          const url =
            api.endpoint === "/v1/units"
              ? `${baseUrl + api.endpoint}`
              : `${baseUrl + api.endpoint}${api.paramsEnabled ? (cursor ? `?limit=1000&cursor=${cursor}` : "?limit=1000") : ""}`;
          const response = await axios.get(url);

          if (response.status != 200) {
            this.logger.error(
              `Could not ping AQI API for ${api.endpoint}. Response Code: ${response.status}`,
            );
            return;
          }

          // Extract response data
          const entries = response.data.domainObjects || [];
          cursor = response.data.cursor || null;
          total = response.data.totalCount || 0;

          this.logger.log(
            `Fetched ${entries.length} entries from ${api.endpoint}. Processed: ${processedCount}/${total}`,
          );

          // Process and filter the data
          const filteredData = await this.filterData(api.endpoint, entries);

          // Stream data into the database in small batches
          await this.updateDatabase(api.dbTable, filteredData, 100);

          // Increment counters
          processedCount += entries.length;
          loopCount++;

          // Log progress periodically
          if (loopCount % 5 === 0 || processedCount >= total) {
            this.logger.log(`Progress: ${processedCount}/${total}`);
          }

          // Break if we've processed all expected entries
          if (processedCount >= total) {
            this.logger.log(`Completed fetching data for ${api.endpoint}`);
            break;
          }

          // Edge case: Break if no entries are returned but the cursor is still valid
          if (entries.length === 0 && cursor) {
            this.logger.warn(
              `Empty response for ${api.endpoint} with cursor ${cursor}. Terminating early.`,
            );
            break;
          }
        } while (cursor); // Continue only if a cursor is provided
      }
    } finally {
      this.logger.log(`Data pull down from AQI completed.`);
      this.logger.log(`Completed pulldown at hour: ${new Date().getHours()}`);
      this.lastPulldownHour = new Date().getHours();
      // this.operationLockService.releaseLock("PULLDOWN");
    }
  }

  private async filterData(endpoint: string, entries: any) {
    const filterAttributes = (obj: any): any => {
      const { id, customId, description, auditAttributes } = obj;
      const creationUserProfileId = auditAttributes.creationUserProfileId;
      const creationTime = auditAttributes.creationTime;
      const modificationUserProfileId =
        auditAttributes.modificationUserProfileId;
      const modificationTime = auditAttributes.modificationTime;

      return {
        id,
        customId,
        description,
        creationUserProfileId,
        creationTime,
        modificationUserProfileId,
        modificationTime,
      };
    };

    const filterNameAttributes = (obj: any): any => {
      const { id, name, description, auditAttributes } = obj;
      const creationUserProfileId = auditAttributes.creationUserProfileId;
      const creationTime = auditAttributes.creationTime;
      const modificationUserProfileId =
        auditAttributes.modificationUserProfileId;
      const modificationTime = auditAttributes.modificationTime;

      return {
        id,
        name,
        description,
        creationUserProfileId,
        creationTime,
        modificationUserProfileId,
        modificationTime,
      };
    };

    const filerAnalysisMethodAttributes = (obj: any): any => {
      const { id, methodId, name, context, auditAttributes } = obj;
      const creationUserProfileId = auditAttributes.creationUserProfileId;
      const creationTime = auditAttributes.creationTime;
      const modificationUserProfileId =
        auditAttributes.modificationUserProfileId;
      const modificationTime = auditAttributes.modificationTime;

      return {
        id,
        methodId,
        name,
        context,
        creationUserProfileId,
        creationTime,
        modificationUserProfileId,
        modificationTime,
      };
    };

    const filterResultUnits = (obj: any): any => {
      const { id, customId, name, auditAttributes } = obj;
      const creationUserProfileId = auditAttributes.creationUserProfileId;
      const creationTime = auditAttributes.creationTime;
      const modificationUserProfileId =
        auditAttributes.modificationUserProfileId;
      const modificationTime = auditAttributes.modificationTime;

      // If name is missing or falsy, use customId as name
      const resolvedName = name || customId;
      const edt_unit = resolvedName?.split(" - ")[0];

      return {
        id,
        customId,
        name: resolvedName,
        edt_unit,
        creationUserProfileId,
        creationTime,
        modificationUserProfileId,
        modificationTime,
      };
    };

    const filterOPResults = (obj: any): any => {
      const { id, customId, description, resultType, auditAttributes } = obj;
      const creationUserProfileId = auditAttributes.creationUserProfileId;
      const creationTime = auditAttributes.creationTime;
      const modificationUserProfileId =
        auditAttributes.modificationUserProfileId;
      const modificationTime = auditAttributes.modificationTime;

      return {
        id,
        customId,
        description,
        resultType,
        creationUserProfileId,
        creationTime,
        modificationUserProfileId,
        modificationTime,
      };
    };

    const filterEELists = (obj: any): any => {
      const { id, customId } = obj;
      const create_user_id = "EnMoDs";
      const create_utc_timestamp = new Date().toISOString();
      const update_user_id = "EnMoDs";
      const update_utc_timestamp = new Date().toISOString();

      return {
        id,
        customId,
        create_user_id,
        create_utc_timestamp,
        update_user_id,
        update_utc_timestamp,
      };
    };

    const filterArray = (array: any): any => {
      if (endpoint == "/v1/tags") {
        return array.map(filterNameAttributes);
      } else if (endpoint == "/v1/analysismethods") {
        return array.map(filerAnalysisMethodAttributes);
      } else if (
        endpoint ==
          "/v1/extendedattributes/6f7d5be0-f91a-4353-9d31-13983205cbe0/dropdownlistitems" ||
        endpoint ==
          "/v1/extendedattributes/65d94fac-aac5-498f-bc73-b63a322ce350/dropdownlistitems"
      ) {
        return array.map(filterEELists);
      } else if (endpoint == "/v1/units") {
        return array.map(filterResultUnits);
      } else if (endpoint == "/v1/observedproperties") {
        return array.map(filterOPResults);
      } else {
        return array.map(filterAttributes);
      }
    };
    return filterArray(entries);
  }

  private async AQSSHealthCheck(): Promise<boolean> {
    const healthcheckUrl = process.env.AQI_BASE_URL + "/v1/status";
    let aqiStatus = null;
    try {
      aqiStatus = (await axios.get(healthcheckUrl)).status;
      this.logger.log(aqiStatus ? `AQI is healthy.` : `AQI is unhealthy.`);
    } catch (err) {
      aqiStatus = err.response.status;
    }

    if (aqiStatus != 200) {
      this.logger.warn(
        `Third party service, AQI, is currently unavailable. No files will be processed.`,
      );
      return false;
    }else{
      return true;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  /**
   * This job is called every minute
   * Before any other checks, this job will check the system time, if the minute is 0 (i.e. top of the hour), it will do the data pull down by calling the fetchAQSSData function
   * Every minute, this job will see if any files need to be deleted (DEL QUEUED), if so, it will do the delete first and THEN
   * Check to see if there are any files with a status of QUEUED to be processed. If there are files to be processed, it will process them one at a time
   * As this loops over all QUEUED files, it will do the first check again.
   */
  private async beginFileValidation() {
    // Block file processing during maintenance window
    if (this.maintenanceWindowActive) {
      this.logger.warn("Maintenance window active. Skipping file processing.");
      return;
    }

    // Try to acquire the lock, if not able to, exit the function
    if (!this.operationLockService.acquireLock("FILE_PROCESSING")) {
      return;
    }

    this.logger.log("Beginning file processing cron job...");

    // Healthcheck for AQI before all files are picked up for processing
    const aqiHealthy = await this.AQSSHealthCheck();
    if (!aqiHealthy) {
      this.operationLockService.releaseLock("FILE_PROCESSING");
      return;
    }

    this.logger.log("AQI Healthcheck passed. Continuing to file checks.");

    // check if system time is at the top of the hour
    const currentDate = new Date();
    const isHourMark = currentDate.getMinutes() === 0;

    if (isHourMark) {
      this.logger.log(
        "Top of the hour detected. Initiating data pull down from AQI.",
      );
      await this.fetchAQSSData();
      this.logger.log("Continuing to file processing.");
    }

    this.logger.log("Checking for files to roll back or delete...");

    // check if any files need to be rolledback
    let filesToRollBack = await this.fileParser.getRollBackFiles();

    if (filesToRollBack.length > 0) {
      this.logger.warn(
        `${filesToRollBack.length} files need rollback. Cannot process any new files until rollbacks have completed.`,
      );

      await this.rollBackFiles(filesToRollBack).then(() => {
        this.logger.log("All rollbacks processed.");
      });
    } else {
      this.logger.log(
        "No files need rollback at this time. Continuing to deletion check.",
      );
    }

    // check if files need to be deleted
    let filesToDelete = await this.fileParser.getFilesToDelete();
    if (filesToDelete.length > 0) {
      this.logger.log(
        `${filesToDelete.length} files need deletion. Processing deletions before new file processing.`,
      );
      await this.deleteFiles(filesToDelete).then(() => {
        this.logger.log("All deletions processed.");
      });
    } else {
      this.logger.log(
        "No files need deletion at this time. Continuing to file processing.",
      );
    }

    // check if any files need to be processed
    let filesToValidate = await this.fileParser.getQueuedFiles();

    if (filesToValidate.length < 1) {
      this.logger.log("************** NO FILES TO PROCESS **************");
      this.operationLockService.releaseLock("FILE_PROCESSING");
      return;
    } else {
      this.processFiles(filesToValidate).then(() => {
        this.logger.log("All files processed.");
      });
    }
  }

  async processFiles(files) {
    this.logger.log("Starting to process queued files...");

    try {
      for (const file of files) {
        try {
          // Check if the hour has changed since the last file was processed
          const now = new Date();
          if (this.lastPulldownHour === null) {
            this.lastPulldownHour = now.getHours();
          } else if (now.getHours() !== this.lastPulldownHour) {
            this.logger.log("Hour change detected during file processing. Initiating data pull down from AQI before next file.");
            await this.fetchAQSSData();
            this.lastPulldownHour = now.getHours(); // keep both in sync
            this.logger.log("Continuing to file processing after pulldown.");
          }

          // Healthcheck for AQI before every file
          const aqiHealthy = await this.AQSSHealthCheck();

          if (!aqiHealthy) {
            return;
          }

          if (this.maintenanceWindowActive) {
            this.logger.warn(
              "Maintenance window active. Preventing next file from being processed.",
            );
            this.operationLockService.releaseLock("FILE_PROCESSING");
            break;
          }

          /*
           * stream the entire file into the temp directory
           * check if the directory exists and create the file path,
           */

          const outputDirectory = "./src/tempObsFiles/";
          fs.mkdirSync(outputDirectory, { recursive: true });
          const filePath = path.join(outputDirectory, file.file_name);

          //get the file from objectstore
          const fileStream = await this.objectStore.getFileData(file.file_name);

          const writer = fs.createWriteStream(filePath);
          fileStream.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          this.logger.log(
            "File saved to temp directory, ready to be read and parsed.",
          );

          //stream the file FROM the temp directory to send to the parsing function
          const fileReadStream = fs.createReadStream(filePath);
          this.logger.log(`SENT FILE: ${file.file_name}`);

          await this.fileParser.parseFile(
            fileReadStream,
            file.file_name,
            file.original_file_name,
            file.submission_id,
            file.file_operation_code,
          );

          this.logger.log(`File ${file.file_name} processed successfully.`);
          //remove the file from the temp directory once processed
          fs.unlink(filePath, (err) => {
            if (err) {
              this.logger.error(`Error cleaning up file`, err);
            } else {
              this.logger.log(`Successfully cleaned up file.`);
            }
          });
        } catch (err) {
          this.logger.error(`Error processing file ${file.file_name}: ${err}`);
        }
      }
    } finally {
      this.operationLockService.releaseLock("FILE_PROCESSING");
      return;
    }
  }

  private async beginDelete() {
    /*
    TODO:
      grab all the files from the DB and S3 bucket that have a status of QUEUED
      for each file returned, change the status to INPROGRESS and go to the parser
    // */
    if (!this.operationLockService.acquireLock("DELETE")) {
      this.logger.warn("Delete cannot be started. Another process running");
      return;
    }

    let filesToDelete = await this.fileParser.getFilesToDelete();

    if (filesToDelete.length < 1) {
      this.logger.log("************** NO FILES TO DELETE **************");
      this.operationLockService.releaseLock("DELETE");
      return;
    } else {
      this.deleteFiles(filesToDelete).then(() => {
        this.logger.log("All files processed.");
      });
    }
  }

  async deleteFiles(files) {
    this.logger.log("Starting to delete queued files...");

    try {
      for (const file of files) {
        try {
          await this.prisma.$transaction(async (prisma) => {
            const updateFileStatus = await this.prisma.file_submission.update({
              where: {
                submission_id: file.submission_id,
              },
              data: {
                submission_status_code: "DELETING",
                update_utc_timestamp: new Date(),
              },
            });
          });
          await this.fileParser.deleteFile(file.file_name, file.submission_id);

          this.logger.log(`File ${file.file_name} deleted successfully.`);
        } catch (err) {
          this.logger.error(`Error deleting file ${file.file_name}: ${err}`);
        }
      }
    } finally {
      this.operationLockService.releaseLock("DELETE");
      return;
    }
  }

  async rollBackFiles(files) {
    this.logger.warn(`Starting rollback............`);
    for (const file of files) {
      try {
        await this.prisma.$transaction(async (prisma) => {
          const updateFileStatus = await this.prisma.file_submission.update({
            where: {
              submission_id: file.submission_id,
            },
            data: {
              submission_status_code: "DELETING",
              update_utc_timestamp: new Date(),
            },
          });
        });
        await this.fileParser.deleteFile(file.file_name, file.submission_id);

        this.logger.log(`File ${file.file_name} rolledback successfully.`);
        await this.prisma.$transaction(async (prisma) => {
          const updateFileStatus = await this.prisma.file_submission.update({
            where: {
              submission_id: file.submission_id,
            },
            data: {
              submission_status_code: "ERROR",
              update_utc_timestamp: new Date(),
            },
          });
        });

        let rollbackError = [];
        let errorMessage = `{"rowNum": "N/A", "type": "ERROR", "message": {"Rollback": "This file has been rolled back. Please re-upload the file."}}`;
        rollbackError.push(JSON.parse(errorMessage));
        const file_error_log_data = {
          file_submission_id: file.submission_id,
          file_name: file.fileName,
          original_file_name: file.original_file_name,
          file_operation_code: file.file_operation_code,
          ministry_contact: [],
          error_log: rollbackError,

          create_utc_timestamp: new Date(),
        };

        await this.prisma.file_error_logs.create({
          data: file_error_log_data,
        });
      } catch (err) {
        this.logger.error(`Error rolling back file ${file.file_name}: ${err}`);
      }
    }
    this.logger.warn(`Finished rolling back files.........`);
  }
}
