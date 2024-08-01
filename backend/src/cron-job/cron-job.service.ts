import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import axios from "axios";
import * as cron from "node-cron";
import { Client } from "pg";
import { error } from "winston";

@Injectable()
export class CronJobService implements OnModuleInit, OnModuleDestroy {
  private client: Client;

  constructor() {
    this.client = new Client({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT),
    });
    this.client.connect();
  }

  onModuleInit() {
    this.scheduleCronJob();
  }

  onModuleDestroy() {
    this.client.end();
  }

  private apisToCall = [
    { endpoint: "/v1/projects", method: "GET", dbTable: "aqi_projects" },
    { endpoint: "/v1/mediums", method: "GET", dbTable: "aqi_mediums" },
    { endpoint: "/v1/units", method: "GET", dbTable: "aqi_units" },
    {
      endpoint: "/v1/collectionmethods",
      method: "GET",
      dbTable: "aqi_collection_methods",
    },
    {
      endpoint: "/v1/extendedattributes",
      method: "GET",
      dbTable: "aqi_extended_attributes",
    },
    {
      endpoint: "/v1/samplinglocations",
      method: "GET",
      dbTable: "aqi_locations",
    },
  ];

  private async updateDatabase(dbTable: string, data: any) {
    try {
      for (const record of data) {
        const values = [
          `'${record.id}'`,
          `'${record.customId}'`,
          record.description == null
            ? `NULL`
            : `'${record.description.replace(/[\r\n]+$/, "")}'`,
          record.creationUserProfileId == null
            ? `NULL`
            : `'${record.creationUserProfileId}'`,
          record.creationTime == null ? `NULL` : `'${record.creationTime}'`,
          record.modificationUserProfileId == null
            ? `NULL`
            : `'${record.modificationUserProfileId}'`,
          record.modificationTime == null
            ? `NULL`
            : `'${record.modificationTime}'`,
        ];

        const sql = `INSERT INTO enmods.${dbTable} (${dbTable}_id, custom_id, description, create_user_id, create_utc_timestamp, update_user_id, update_utc_timestamp) 
          VALUES (${values}) ON CONFLICT (${dbTable}_id) DO UPDATE SET custom_id = EXCLUDED.custom_id, description = EXCLUDED.description, 
          create_user_id = EXCLUDED.create_user_id, create_utc_timestamp = EXCLUDED.create_utc_timestamp, 
          update_user_id = EXCLUDED.update_user_id, update_utc_timestamp = EXCLUDED.update_utc_timestamp;`;

        await this.client.query(sql);
      }

      console.log(
        `${dbTable} -- Operation completed successfully! \n #########################################################`
      );
      return;
    } catch (err) {
      console.error(`Error updating #### ${dbTable} #### table`, error);
    }
  }

  private async fetchDataFromAQI() {
    axios.defaults.method = "GET";
    axios.defaults.headers.common["Authorization"] =
      "token " + process.env.AQI_ACCESS_TOKEN;
    axios.defaults.headers.common["x-api-key"] = process.env.AQI_ACCESS_TOKEN;
    axios.defaults.baseURL = process.env.AQI_BASE_URL;

    for (const api of this.apisToCall) {
      try {
        let config = {
          url: api.endpoint,
        };

        axios.request(config).then(async (response) => {
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
          const filteredData = filterArray(response.data.domainObjects);
          await this.updateDatabase(api.dbTable, filteredData);
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  private scheduleCronJob() {
    cron.schedule("* */2 * * * * ", () => {
      this.fetchDataFromAQI();
    });
  }
}
