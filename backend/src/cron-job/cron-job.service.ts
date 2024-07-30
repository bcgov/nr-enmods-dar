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
    { endpoint: "/v1/projects", method: "GET", dbTable: "enmods.aqi_projects" },
  ];

  private async updateDatabase(dbTable: string, data: any) {
    try{
        const sql: string = `
        INSERT INTO ${dbTable} (id, customId, description, create_user_id, create_utc_timestamp, update_user_id, update_utc_timestamp) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET 
        custom_id = EXCLUDED.custom_id,
        description = EXCLUDED.description,
        create_user_id = EXCLUDED.create_user_id,
        create_utc_timestamp = EXCLUDED.create_utc_timestamp,
        update_user_id = EXCLUDED.update_user_id,
        update_utc_timestamp = EXCLUDED.update_utc_timestamp;`;

        for (const record of data){
            const values = [record.id, record.customId, record.description, record.creationUserProfileId, record.creationTime, record.modificationUserProfileId, record.modificationTime]
            await this.client.query(sql, values); 
        }

        console.log("Operation completed successfully!")
    }catch (err){
        console.error(`Error updating ${dbTable} table`, error);
    }
  }

  private async fetchDataFromAQI() {
    this.apisToCall.forEach((api) => {
      try {
        let config = {
          method: api.method,
          maxBodyLength: Infinity,
          url: process.env.AQI_BASE_URL + api.endpoint,
          headers: {
            Authorization: "token " + process.env.AQI_ACCESS_TOKEN,
            "x-api-key": process.env.AQI_ACCESS_TOKEN,
          },
        };

        axios.request(config).then(async (response) => {
          const filterAttributes = (obj: any): any => {
            const { id, customId, description, auditAttributes } = obj;
            const creationUserProfileId = auditAttributes.creationUserProfileId
            const creationTime = auditAttributes.creationTime
            const modificationUserProfileId = auditAttributes.modificationUserProfileId
            const modificationTime = auditAttributes.modificationTime

            return {
              id,
              customId,
              description,
              creationUserProfileId, 
              creationTime, 
              modificationUserProfileId, 
              modificationTime
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
    });
  }

  private scheduleCronJob() {
    cron.schedule("*/10 * * * * * ", () => {
      this.fetchDataFromAQI();
    });
  }
}
