import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import { PrismaService } from "nestjs-prisma";
import path from "path";

@Injectable()
export class AqiApiService {
  private readonly logger = new Logger(AqiApiService.name);
  private axiosInstance: AxiosInstance;

  private wait = (seconds: number) =>
    new Promise((resolve) => setTimeout(resolve, seconds * 1000));

  constructor(private prisma: PrismaService) {
    this.axiosInstance = axios.create({
      baseURL: process.env.AQI_BASE_URL,
      headers: {
        Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "x-api-key": process.env.AQI_ACCESS_TOKEN,
      },
    });
  }

  async fieldVisits(body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/fieldvisits", body);
      this.logger.log(`API call to Field Visits succeeded: ${response.status}`);
      return response.data.id;
    } catch (err) {
      console.error(
        "API CALL TO Field Visits failed: ",
        err.response.data.message,
      );
    }
  }

  async fieldActivities(body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/activities", body);
      this.logger.log(`API call to Activities succeeded: ${response.status}`);
      return response.data.id;
    } catch (err) {
      console.error(
        "API CALL TO Activities failed: ",
        err.response.data.message,
      );
    }
  }

  async fieldSpecimens(body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/specimens", body);
      this.logger.log(`API call to Specimens succeeded: ${response.status}`);
      return response.data.id;
    } catch (err) {
      console.error(
        "API CALL TO Specimens failed: ",
        err.response.data.message,
      );
    }
  }

  async importObservations(fileName: any, method: string) {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(fileName));
    try {
      if (method == "dryrun") {
        const response = await axios.post(
          `${process.env.AQI_BASE_URL}/v2/observationimports/dryrun?fileType=SIMPLE_CSV&timeZoneOffset=-08:00&linkFieldVisitsForNewObservations=true`,
          formData,
          {
            headers: {
              Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
              Accept: "application/json; text/plain",
              "x-api-key": process.env.AQI_ACCESS_TOKEN,
              ...formData.getHeaders(),
            },
          },
        );
        this.logger.log(
          `API call to Observations Dry Run succeeded: ${response.status}`,
        );

        const statusURL = response.headers.location;
        const obsStatus = await this.getObservationsStatusResult(statusURL);

        const errorMessages = this.parseObsResultResponse(obsStatus);
        return errorMessages;
      } else {
        const response = await axios.post(
          `${process.env.AQI_BASE_URL}/v2/observationimports?fileType=SIMPLE_CSV&timeZoneOffset=-08:00&linkFieldVisitsForNewObservations=true`,
          formData,
          {
            headers: {
              Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
              Accept: "application/json; text/plain",
              "x-api-key": process.env.AQI_ACCESS_TOKEN,
              ...formData.getHeaders(),
            },
          },
        );
        this.logger.log(
          `API call to Observation Import succeeded: ${response.status}`,
        );
        const statusURL = response.headers.location;
        const obsStatus = await this.getObservationsStatusResult(statusURL);

        const errorMessages = this.parseObsResultResponse(obsStatus);
        return errorMessages;
      }
    } catch (err) {
      console.error("API call to Observation Import failed: ", err);
    }
  }

  async getObservationsStatusResult(statusURL: string) {
    try {
      const response = await axios.get(statusURL, {
        headers: {
          Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
          "x-api-key": process.env.AQI_ACCESS_TOKEN,
        },
      });

      await this.wait(10);

      const obsResultResponse = await axios.get(
        `${process.env.AQI_BASE_URL}/v2/observationimports/${response.data.id}/result`,
        {
          headers: {
            Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
            "x-api-key": process.env.AQI_ACCESS_TOKEN,
          },
        },
      );

      this.logger.log(
        `API call to Observations Status succeeded: ${response.status}`,
      );
      return obsResultResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 409) {
          console.warn("409 Conflict: Continuing without failing");
          return axiosError.response.data;
        } else {
          console.error(
            "API CALL TO Observations Status failed: ",
            err.response,
          );
        }
      }
    }
  }

  parseObsResultResponse(obsResults: any) {
    let errorMessages = [];
    if (obsResults.errorCount > 0) {
      obsResults.importItems.forEach((item) => {
        const rowId = item.rowId;
        const errors = item.errors;

        Object.entries(errors).forEach((error) => {
          let errorLog = `{"rowNum": ${rowId}, "type": "ERROR", "message": {"Observation File": "${error[1][0].errorMessage}"}}`;
          errorMessages.push(JSON.parse(errorLog));
        });
      });
    }
    return errorMessages;
  }

  async databaseLookup(dbTable: string, queryParam: string) {
    try {
      let result = await this.prisma[dbTable].findMany({
        where: {
          custom_id: queryParam,
        },
      });
      if (result.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(`API CALL TO ${dbTable} failed: `, err);
    }
  }

  async AQILookup(dbTable: string, queryParam: any) {
    let result = null;
    if (dbTable == "aqi_field_visits") {
      try {
        result = await this.prisma[dbTable].findMany({
          where: {
            aqi_location_custom_id: queryParam[0],
            aqi_field_visit_start_time: queryParam[1],
          },
        });
      } catch (err) {
        console.error(`API CALL TO ${dbTable} failed: `, err);
      }
    } else if (dbTable == "aqi_field_activities") {
      try {
        result = await this.prisma[dbTable].findMany({
          where: {
            aqi_field_activities_custom_id: queryParam[0],
            aqi_field_visit_start_time: queryParam[1],
            aqi_location_custom_id: queryParam[2],
          },
        });
      } catch (err) {
        console.error(`API CALL TO ${dbTable} failed: `, err);
      }
    } else if (dbTable == "aqi_specimens") {
      try {
        result = await this.prisma[dbTable].findMany({
          where: {
            aqi_specimens_custom_id: queryParam[0],
            aqi_field_activities_start_time: queryParam[1],
            aqi_field_activities_custom_id: queryParam[2],
            aqi_location_custom_id: queryParam[3],
          },
        });
      } catch (err) {
        console.error(`API CALL TO ${dbTable} failed: `, err);
      }
    }

    if (result.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  mergeErrorMessages(localErrors: any[], remoteErrors: any[]) {
    const map = new Map<number, any>();

    const mergeItem = (item: any) => {
      const exists = map.get(item.rowNum);
      map.set(
        item.rowNum,
        exists
          ? { ...exists, message: { ...exists.message, ...item.message } }
          : item,
      );
    };

    [...localErrors, ...remoteErrors].forEach(mergeItem);

    return Array.from(map.values());
  }

  getUnique(type: string, data: any[]): any[] {
    switch (type) {
      case "obs":
        let uniqueObservations = [];
        data.filter((item) => {
          const pairKey = `${item.id}`;
          if (!uniqueObservations.includes(pairKey)) {
            uniqueObservations.push(pairKey);
          }
        });
        return uniqueObservations;
      case "specimen":
        let uniqueSpecimens =[];
        data.filter((item) => {
          const pairKey = `${item.id}`;
          if (!uniqueSpecimens.includes(pairKey)) {
            uniqueSpecimens.push(pairKey);
          }
        });
        return uniqueSpecimens;
      case "activity":
        let uniqueActivities = [];
        data.filter((item) => {
          const pairKey = `${item.id}`;
          if (!uniqueActivities.includes(pairKey)) {
            uniqueActivities.push(pairKey);
          }
        });
        return uniqueActivities;
      case "visit":
        let uniqueVisits = [];
        data.filter((item) => {
          const pairKey = `${item.id}`;
          if (!uniqueVisits.includes(pairKey)) {
            uniqueVisits.push(pairKey);
          }
        });
        return uniqueVisits;
      default:
        return [];
    }
  }

  async deleteRelatedData(file_name: string) {
    let file_name_to_search = `obs-${path.parse(file_name).name}`;
    let allObservations = [],
      uniqueObservations = [];
    let allSpecimens = [],
      uniqueSpecimens = [];
    let allActivities = [],
      uniqueActivities = [];
    let allVisits = [],
      uniqueVisits = [];
    try {
      let observations = (
        await this.axiosInstance.get("/v2/observations?limit=1000")
      ).data.domainObjects;
      const relatedData = observations.filter((observation) =>
        observation.activity.loggerFileName.includes(file_name_to_search),
      );

      relatedData.forEach((observation) => {
        allObservations.push({
          id: observation.id,
          customID: observation.customId,
        });
        allSpecimens.push({
          id: observation.specimen.id,
          customID: observation.specimen.name,
        });
        allActivities.push({
          id: observation.activity.id,
          customID: observation.activity.customId,
        });
        allVisits.push({
          id: observation.fieldVisit.id,
          startTime: observation.fieldVisit.startTime,
        });
      });

      uniqueObservations = this.getUnique("obs", allObservations);
      uniqueSpecimens = this.getUnique("specimen", allSpecimens);
      uniqueActivities = this.getUnique("activity", allActivities);
      uniqueVisits = this.getUnique("visit", allVisits);


      
    } catch (err) {
      console.error(`API call to fetch Observations failed: `, err);
    }
  }
}
