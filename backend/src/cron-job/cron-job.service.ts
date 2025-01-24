import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import axios, { create } from "axios";
import { error } from "winston";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "nestjs-prisma";
import { FileParseValidateService } from "src/file_parse_and_validation/file_parse_and_validation.service";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { resolve } from "path";

/**
 * Cron Job service for filling code tables with data from AQI API
 */
@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  private tableModels;
  private isProcessing = false;

  private dataPullDownComplete: boolean = false;
  constructor(
    private prisma: PrismaService,
    private readonly fileParser: FileParseValidateService,
    private readonly objectStore: ObjectStoreService,
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
      ["aqi_field_visits", this.prisma.aqi_field_visits],
      ["aqi_field_activities", this.prisma.aqi_field_activities],
      ["aqi_specimens", this.prisma.aqi_specimens],
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
      endpoint: "/v1/extendedattributes/65d94fac-aac5-498f-bc73-b63a322ce350/dropdownlistitems",
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
      endpoint: "/v1/fieldvisits",
      method: "GET",
      dbTable: "aqi_field_visits",
      paramsEnabled: true,
    },
    {
      endpoint: "/v1/activities",
      method: "GET",
      dbTable: "aqi_field_activities",
      paramsEnabled: true,
    },
    {
      endpoint: "/v1/specimens",
      method: "GET",
      dbTable: "aqi_specimens",
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
      case "aqi_field_visits":
        return {
          aqi_field_visit_start_time: new Date(record.startTime),
          aqi_location_custom_id: record.locationCustomID,
        };
      case "aqi_field_activities":
        return {
          aqi_field_activities_start_time: new Date(record.startTime),
          aqi_field_activities_custom_id: record.customId,
          aqi_field_visit_start_time: new Date(record.visitStartTime),
          aqi_location_custom_id: record.locationCustomID,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
      case "aqi_specimens":
        return {
          aqi_specimens_custom_id: record.name,
          aqi_field_activities_start_time: record.activityStartTime,
          aqi_field_activities_custom_id: record.activityCustomId,
          aqi_location_custom_id: record.locationCustomID,
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
      case "aqi_field_visits":
        return {
          [`${dbTable}_id`]: record.id,
          aqi_field_visit_start_time: new Date(record.startTime),
          aqi_location_custom_id: record.locationCustomID,
        };
      case "aqi_field_activities":
        return {
          [`${dbTable}_id`]: record.id,
          aqi_field_activities_start_time: new Date(record.startTime),
          aqi_field_activities_custom_id: record.customId,
          aqi_field_visit_start_time: new Date(record.visitStartTime),
          aqi_location_custom_id: record.locationCustomID,
          create_user_id: record.creationUserProfileId,
          create_utc_timestamp: record.creationTime
            ? new Date(record.creationTime)
            : null,
          update_user_id: record.modificationUserProfileId,
          update_utc_timestamp: record.modificationTime
            ? new Date(record.modificationTime)
            : null,
        };
      case "aqi_specimens":
        return {
          [`${dbTable}_id`]: record.id,
          aqi_specimens_custom_id: record.name,
          aqi_field_activities_start_time: record.activityStartTime,
          aqi_field_activities_custom_id: record.activityCustomId,
          aqi_location_custom_id: record.locationCustomID,
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async fetchAQSSData() {
    if (this.isProcessing){
      this.logger.log("Skipping cron procedure of data pull down: File processing underway.");
      return;
    }

    this.logger.log(`Starting Code Table Cron Job`);
    axios.defaults.method = "GET";
    axios.defaults.headers.common["Authorization"] =
      "token " + process.env.AQI_ACCESS_TOKEN;
    axios.defaults.headers.common["x-api-key"] = process.env.AQI_ACCESS_TOKEN;

    const baseUrl = process.env.AQI_BASE_URL;

    for (const api of this.apisToCall) {
      this.logger.log(`Getting data from ${api.endpoint}`);
      let cursor = "";
      let total = 0;
      let processedCount = 0;
      let loopCount = 0;

      do {
        const url = `${baseUrl + api.endpoint}${api.paramsEnabled ? (cursor ? `?limit=1000&cursor=${cursor}` : "?limit=1000") : ""}`;
        const response = await axios.get(url);

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

    this.logger.log(`Cron Job completed.`);
    this.dataPullDownComplete = true;
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
    const filterFieldVisitAttributes = (obj: any): any => {
      const { id, startTime, samplingLocation } = obj;
      const locationCustomID = samplingLocation.customId;

      return {
        id,
        startTime,
        locationCustomID,
      };
    };
    const filterActivityAttributes = (obj: any): any => {
      const {
        id,
        customId,
        startTime,
        fieldVisit,
        samplingLocation,
        auditAttributes,
      } = obj;
      const locationCustomID = samplingLocation.customId;
      const visitStartTime = fieldVisit.startTime;
      const creationUserProfileId = auditAttributes.creationUserProfileId;
      const creationTime = auditAttributes.creationTime;
      const modificationUserProfileId =
        auditAttributes.modificationUserProfileId;
      const modificationTime = auditAttributes.modificationTime;

      return {
        id,
        customId,
        startTime,
        visitStartTime,
        locationCustomID,
        creationUserProfileId,
        creationTime,
        modificationUserProfileId,
        modificationTime,
      };
    };
    const filterSpecimenAttributes = (obj: any): any => {
      const { id, name, activity } = obj;
      const activityStartTime = activity.startTime;
      const activityCustomId = activity.customId;
      const locationCustomID = activity.samplingLocation.customId;

      return {
        id,
        name,
        activityStartTime,
        activityCustomId,
        locationCustomID,
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
      } else if (endpoint == "/v1/fieldvisits") {
        return array.map(filterFieldVisitAttributes);
      } else if (endpoint == "/v1/activities") {
        return array.map(filterActivityAttributes);
      } else if (endpoint == "/v1/specimens") {
        return array.map(filterSpecimenAttributes);
      } else if (endpoint == "/v1/analysismethods") {
        return array.map(filerAnalysisMethodAttributes);
      } else if (
        endpoint ==
        "/v1/extendedattributes/6f7d5be0-f91a-4353-9d31-13983205cbe0/dropdownlistitems" ||
        endpoint ==
        "/v1/extendedattributes/65d94fac-aac5-498f-bc73-b63a322ce350/dropdownlistitems" 
      ) {
        return array.map(filterEELists);
      } else {
        return array.map(filterAttributes);
      }
    };
    return filterArray(entries);
  }

  @Cron(CronExpression.EVERY_MINUTE) // every 2 hours
  private async beginFileValidation() {
    /*
    TODO:
      grab all the files from the DB and S3 bucket that have a status of QUEUED
      for each file returned, change the status to INPROGRESS and go to the parser
    // */
    // if (!this.dataPullDownComplete) {
    //   this.logger.warn("Data pull down from AQI did not complete");
    //   return;
    // }

    let filesToValidate = await this.fileParser.getQueuedFiles();

    if (filesToValidate.length < 1) {
      this.logger.log("************** NO FILES TO VALIDATE **************");
      return;
    } else {
      this.processFiles(filesToValidate).then(() => {
        this.logger.log("All files processed.");
      });
    }
  }

  async processFiles(files) {
    if (this.isProcessing){
      this.logger.log("Skipping cron procedure of file processing: Already processing files.");
      return;
    }

    this.isProcessing = true;
    this.logger.log("Starting to process queued files...");

    try{
      for (const file of files) {
        try {
          const fileStream = await this.objectStore.getFileData(file.file_name);
          this.logger.log(`SENT FILE: ${file.file_name}`);

          await this.fileParser.parseFile(
            fileStream,
            file.file_name,
            file.original_file_name,
            file.submission_id,
            file.file_operation_code,
          );

          this.logger.log(`File ${file.file_name} processed successfully.`);
        } catch (err) {
          this.logger.error(`Error processing file ${file.file_name}: ${err}`);
        }

        this.logger.log("GOING TO NEXT FILE");
      }
    }finally{
      this.isProcessing = false;
      this.dataPullDownComplete = false;
      return;
    }
  }
}
