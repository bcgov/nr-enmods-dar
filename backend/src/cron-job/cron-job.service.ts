import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { error } from "winston";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "nestjs-prisma";
import { FileParseValidateService } from "src/file_parse_and_validation/file_parse_and_validation.service";
import * as fs from "fs";


/**
 * Cron Job service for filling code tables with data from AQI API
 */
@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);

  private tableModels;

  constructor(
    private prisma: PrismaService,
    private readonly fileParser: FileParseValidateService,
  ) {
    this.tableModels = new Map<string, any>([
      ["aqi_projects", this.prisma.aqi_projects],
      ["aqi_mediums", this.prisma.aqi_mediums],
      ["aqi_units", this.prisma.aqi_units],
      ["aqi_collection_methods", this.prisma.aqi_collection_methods],
      ["aqi_extended_attributes", this.prisma.aqi_extended_attributes],
      ["aqi_locations", this.prisma.aqi_locations],
    ]);
  }

  private apisToCall = [
    {
      endpoint: "/api/v1/projects",
      method: "GET",
      dbTable: "aqi_projects",
      paramsEnabled: false,
    },
    {
      endpoint: "/api/v1/mediums",
      method: "GET",
      dbTable: "aqi_mediums",
      paramsEnabled: false,
    },
    {
      endpoint: "/api/v1/units",
      method: "GET",
      dbTable: "aqi_units",
      paramsEnabled: false,
    },
    {
      endpoint: "/api/v1/collectionmethods",
      method: "GET",
      dbTable: "aqi_collection_methods",
      paramsEnabled: false,
    },
    {
      endpoint: "/api/v1/extendedattributes",
      method: "GET",
      dbTable: "aqi_extended_attributes",
      paramsEnabled: false,
    },
    {
      endpoint: "/api/v1/samplinglocations",
      method: "GET",
      dbTable: "aqi_locations",
      paramsEnabled: true,
    },
  ];

  private async updateDatabase(dbTable: string, data: any) {
    const startTime = new Date().getTime();
    try {
      const model = this.tableModels.get(dbTable);
      if (!model) throw new Error(`Unknown dbTable: ${dbTable}`);
      this.logger.log(`Upserting ${data.length} entries into ${dbTable}...`);

      await this.prisma.$transaction(
        data.map((record) =>
          model.upsert({
            where: { [dbTable + "_id"]: record.id },
            update: {
              custom_id: record.customId,
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
              custom_id: record.customId,
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

      this.logger.log(
        `Upserted ${data.length} entries into ${dbTable} - ${(new Date().getTime() - startTime) / 1000} seconds`,
      );
      this.logger.log(`-`);
      return;
    } catch (err) {
      console.error(`Error updating #### ${dbTable} #### table`, error);
    }
  }

  @Cron("0 0 */2 * * *") // every 2 hours
  private async fetchLocations() {
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

      const filteredData = await this.filterData(entries);
      await this.updateDatabase(api.dbTable, filteredData);
    }

    this.logger.log(
      `Cron Job Time Taken: ${(new Date().getTime() - startTime) / 1000} seconds`,
    );
    this.logger.log(`#######################################################`);
  }

  private async filterData(entries: any) {
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

    const filterArray = (array: any): any => {
      return array.map(filterAttributes);
    };
    return filterArray(entries);
  }

  @Cron("0 */1 * * * *")
  private async beginFileValidation() {
    /*
    TODO:
      grab all the files from the DB and S3 bucket that have a status of QUEUED
      for each file returned, change the status to INPROGRESS and go to the parser
    */
    let filesToValidate = await this.fileParser.getQueuedFiles();
    for (const file of filesToValidate) {
      // const fileData = await this.fileParser.getFileData(file.submission_id)
      const fileData = fs.readFileSync(`C:/Users/vmanawat/Downloads/TEST_MASTER_FILE.xlsx`, 'binary')
      this.fileParser.parseFile(fileData, file.file_name)
    }
  }
}
