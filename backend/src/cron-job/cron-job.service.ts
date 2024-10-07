import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { error } from "winston";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "nestjs-prisma";
import { FileParseValidateService } from "src/file_parse_and_validation/file_parse_and_validation.service";
import { ObjectStoreService } from "src/objectStore/objectStore.service";

/**
 * Cron Job service for filling code tables with data from AQI API
 */
@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  private tableModels;

  private dataPullDownComplete: boolean = false;
  constructor(
    private prisma: PrismaService,
    private readonly fileParser: FileParseValidateService,
    private readonly objectStore: ObjectStoreService,
  ) {
    this.tableModels = new Map<string, any>([
      ["aqi_projects", this.prisma.aqi_projects],
      ["aqi_mediums", this.prisma.aqi_mediums],
      ["aqi_units", this.prisma.aqi_units],
      ["aqi_collection_methods", this.prisma.aqi_collection_methods],
      ["aqi_extended_attributes", this.prisma.aqi_extended_attributes],
      ["aqi_context_tags", this.prisma.aqi_context_tags],
      ["aqi_laboratories", this.prisma.aqi_laboratories],
      ["aqi_observed_properties", this.prisma.aqi_observed_properties],
      ["aqi_detection_conditions", this.prisma.aqi_detection_conditions],
      ["aqi_result_status", this.prisma.aqi_result_status],
      ["aqi_result_grade", this.prisma.aqi_result_grade],
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
      endpoint: "/v1/units",
      method: "GET",
      dbTable: "aqi_units",
      paramsEnabled: false,
    },
    {
      endpoint: "/v1/collectionmethods",
      method: "GET",
      dbTable: "aqi_collection_methods",
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

  private async updateDatabase(dbTable: string, data: any) {
    const startTime = new Date().getTime();
    try {
      const model = this.tableModels.get(dbTable);
      if (!model) throw new Error(`Unknown dbTable: ${dbTable}`);
      this.logger.log(`Upserting ${data.length} entries into ${dbTable}...`);

      if (dbTable == "aqi_field_visits") {
        await this.prisma.$transaction(
          data.map((record) =>
            model.upsert({
              where: { [dbTable + "_id"]: record.id },
              update: {
                aqi_field_visit_start_time: new Date(record.startTime),
                aqi_location_custom_id: record.locationCustomID,
              },
              create: {
                [dbTable + "_id"]: record.id,
                aqi_field_visit_start_time: new Date(record.startTime),
                aqi_location_custom_id: record.locationCustomID,
              },
            }),
          ),
        );
      } else if (dbTable == "aqi_field_activities") {
        await this.prisma.$transaction(
          data.map((record) =>
            model.upsert({
              where: { [dbTable + "_id"]: record.id },
              update: {
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
              },
              create: {
                [dbTable + "_id"]: record.id,
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
              },
            }),
          ),
        );
      } else if (dbTable == "aqi_specimens") {
        await this.prisma.$transaction(
          data.map((record) =>
            model.upsert({
              where: { [dbTable + "_id"]: record.id },
              update: {
                aqi_specimens_custom_id: record.name,
                aqi_field_activities_start_time: record.activityStartTime,
                aqi_field_activities_custom_id: record.activityCustomId,
                aqi_location_custom_id: record.locationCustomID,
              },
              create: {
                [dbTable + "_id"]: record.id,
                aqi_specimens_custom_id: record.name,
                aqi_field_activities_start_time: record.activityStartTime,
                aqi_field_activities_custom_id: record.activityCustomId,
                aqi_location_custom_id: record.locationCustomID,
              },
            }),
          ),
        );
      } else {
        await this.prisma.$transaction(
          data.map((record) =>
            model.upsert({
              where: { [dbTable + "_id"]: record.id },
              update: {
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
              },
              create: {
                [dbTable + "_id"]: record.id,
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
              },
            }),
          ),
        );
      }

      this.logger.log(
        `Upserted ${data.length} entries into ${dbTable} - ${(new Date().getTime() - startTime) / 1000} seconds`,
      );
      this.logger.log(`-`);
      return;
    } catch (err) {
      console.error(`Error updating #### ${dbTable} #### table`, error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  private async fetchAQSSData() {
    this.logger.log(`#######################################################`);
    this.logger.log(`Starting Code Table Cron Job`);
    axios.defaults.method = "GET";
    axios.defaults.headers.common["Authorization"] =
      "token " + process.env.AQI_ACCESS_TOKEN;
    axios.defaults.headers.common["x-api-key"] = process.env.AQI_ACCESS_TOKEN;

    const baseUrl = process.env.AQI_BASE_URL;
    const startTime = new Date().getTime();

    for (const api of this.apisToCall) {
      this.logger.log(`Getting data from ${api.endpoint}`);
      let cursor = "";
      let total = 0;
      let entries = [];
      let loopCount = 0;
      do {
        const url = `${baseUrl + api.endpoint}${api.paramsEnabled ? (cursor ? `?limit=1000&cursor=${cursor}` : "?limit=1000") : ""}`;
        let response = await axios.get(url);
        total = response.data.totalCount;
        cursor = response.data.cursor;

        if (total <= entries.length + response.data.domainObjects.length) {
          // At this point, cursor has fully looped. Check for duplicate entries and remove them
          const newEntries = response.data.domainObjects.filter(
            (entry) => !entries.some((e) => e.id === entry.id),
          );
          entries = entries.concat(newEntries);
        } else {
          entries = entries.concat(response.data.domainObjects);
        }
        loopCount++;
        if (loopCount === 1 || loopCount % 5 === 0 || total <= entries.length) {
          this.logger.log(`Fetching entries: ${entries.length}/${total}`);
        }
      } while (total > entries.length && api.paramsEnabled);

      const filteredData = await this.filterData(api.endpoint, entries);
      try {
        await this.updateDatabase(api.dbTable, filteredData);
        this.dataPullDownComplete = true;
      } catch (error) {
        this.dataPullDownComplete = false;
        console.error(`Error updating database for ${api.endpoint}`, error);
      }
    }

    this.logger.log(
      `Cron Job Time Taken: ${(new Date().getTime() - startTime) / 1000} seconds`,
    );

    this.logger.log(`#######################################################`);
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
    const filterArray = (array: any): any => {
      if (endpoint == "/v1/tags") {
        return array.map(filterNameAttributes);
      } else if (endpoint == "/v1/fieldvisits") {
        return array.map(filterFieldVisitAttributes);
      } else if (endpoint == "/v1/activities") {
        return array.map(filterActivityAttributes);
      } else if (endpoint == "/v1/specimens") {
        return array.map(filterSpecimenAttributes);
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
    */
    if (!this.dataPullDownComplete) {
      this.logger.warn("Data pull down from AQSS did not complete");
      return;
    }

    let filesToValidate = await this.fileParser.getQueuedFiles();

    if (filesToValidate.length < 1) {
      console.log("************** NO FILES TO VALIDATE **************");
      return;
    } else {
      this.processFiles(filesToValidate).then(() => {
        this.logger.log("All files processed.");
      });
    }
  }

  async processFiles(files) {
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    for (const file of files) {
      const fileBinary = await this.objectStore.getFileData(file.file_name);
      this.logger.log(`SENT FILE: ${file.file_name}`);

      await this.fileParser.parseFile(
        fileBinary,
        file.file_name,
        file.original_file_name,
        file.submission_id,
        file.file_operation_code,
      );
      
      this.logger.log(`WAITING FOR PREVIOUS FILE`);
      this.logger.log("GOING TO NEXT FILE");
    }
    this.dataPullDownComplete = false;
    return;
  }
}
