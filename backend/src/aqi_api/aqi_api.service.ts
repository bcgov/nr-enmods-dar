import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import { PrismaService } from "nestjs-prisma";
import path from "path";
import { JsonValue } from "@prisma/client/runtime/library";

@Injectable()
export class AqiApiService {
  private readonly logger = new Logger(AqiApiService.name);
  private axiosInstance: AxiosInstance;

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
      this.logger.log(
        `API call to POST Field Visits succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        "API CALL TO POST Field Visits failed: ",
        err.response.data.message,
      );
    }
  }

  async putFieldVisits(GUID: string, body: any) {
    try {
      const response = await this.axiosInstance.put(
        `/v1/fieldvisits/${GUID}`,
        body,
      );
      this.logger.log(
        `API call to PUT Field Visits succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        "API CALL TO PUT Field Visits failed: ",
        err.response.data.message,
      );
    }
  }

  async fieldActivities(body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/activities", body);
      this.logger.log(
        `API call to POST Activities succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        "API CALL TO POST Activities failed: ",
        err.response.data.message,
      );
    }
  }

  async putFieldActivities(GUID: string, body: any) {
    try {
      const response = await this.axiosInstance.put(
        `/v1/activities/${GUID}`,
        body,
      );
      this.logger.log(
        `API call to PUT Field Activities succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        "API CALL TO PUT Field Activities failed: ",
        err.response.data.message,
      );
    }
  }

  async fieldSpecimens(body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/specimens", body);
      this.logger.log(
        `API call to POST Specimens succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        "API CALL TO POST Specimens failed: ",
        err.response.data.message,
      );
    }
  }

  async putSpecimens(GUID: string, body: any) {
    try {
      const response = await this.axiosInstance.put(
        `/v1/specimens/${GUID}`,
        body,
      );
      this.logger.log(
        `API call to PUT Specimens succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        "API CALL TO PUT Specimens failed: ",
        err.response.data.message,
      );
    }
  }

  async getObservationsFromFile(fileName: string) {
    try {
      let observations = (
        await this.axiosInstance.get("/v2/observations?limit=1000")
      ).data.domainObjects;

      const relatedData = observations
        .filter((observation) =>
          observation.extendedAttributes.some(
            (attribute) => attribute.text === fileName,
          ),
        )
        .map((observation) => observation.id);
      return relatedData;
    } catch (err) {
      this.logger.error("API CALL TO GET Observations from File failed: ", err);
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
      this.logger.error("API call to Observation Import failed: ", err);
    }
  }

  async getObservationsStatusResult(statusURL: string) {
    const wait = async (ms: number) => {
      const seconds = ms / 1000;
      for (let i = 1; i <= seconds; i++) {
        await new Promise((resolve) => setTimeout(resolve, ms)); // wait 1 second
      }
    };

    try {
      const response = await axios.get(statusURL, {
        headers: {
          Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
          "x-api-key": process.env.AQI_ACCESS_TOKEN,
        },
      });

      await wait(7000);

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
          this.logger.error(
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
      this.logger.error(`API CALL TO ${dbTable} failed: `, err);
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
        if (result.length > 0) {
          return result[0].aqi_field_visits_id;
        } else {
          return null;
        }
      } catch (err) {
        this.logger.error(`API CALL TO ${dbTable} failed: `, err);
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
        if (result.length > 0) {
          return result[0].aqi_field_activities_id;
        } else {
          return null;
        }
      } catch (err) {
        this.logger.error(`API CALL TO ${dbTable} failed: `, err);
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
        if (result.length > 0) {
          return result[0].aqi_specimens_id;
        } else {
          return null;
        }
      } catch (err) {
        this.logger.error(`API CALL TO ${dbTable} failed: `, err);
      }
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
        let uniqueSpecimens = [];
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

  async deleteRelatedData(fileName: string) {
    const guidsToDelete: any = await this.prisma.aqi_imported_data.findMany({
      where: {
        file_name: fileName,
      },
    });
    
    // Delete all the observations from the list of imported guids
    if (guidsToDelete[0].imported_guids.observations.length > 0) {
      try {
        let deletion = await axios.delete(
          `${process.env.AQI_BASE_URL}/v2/observations?ids=${guidsToDelete[0].imported_guids.observations}`,
          {
            headers: {
              Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
              "x-api-key": process.env.AQI_ACCESS_TOKEN,
            },
          },
        );
        console.log("AQI OBS DELETION: " + deletion.data);
      } catch (err) {
        this.logger.error(`API call to delete AQI observation failed: `, err);
      }
    }

    // Delete all the specimens for the activities imported from AQI and the PSQL db
    if (guidsToDelete[0].imported_guids.specimens.length > 0) {
      for (const specimen of guidsToDelete[0].imported_guids.specimens) {
        try {
          let aqiDeletion = await axios.delete(
            `${process.env.AQI_BASE_URL}/v1/specimens/${specimen}`,
            {
              headers: {
                Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
                "x-api-key": process.env.AQI_ACCESS_TOKEN,
              },
            },
          );
          console.log("AQI SPECIMEN DELETION: " + aqiDeletion.data);

          try {
            const dbDeletion = await this.prisma.aqi_specimens.delete({
              where: {
                aqi_specimens_id: specimen,
              },
            });
            console.log("DB SPECIMEN DELETION: " + dbDeletion);
          } catch (err) {
            this.logger.error(`API call to delete DB specimen failed: `, err);
          }
        } catch (err) {
          this.logger.error(`API call to delete AQI specimen failed: `, err);
        }
      }
    }

    // Delete all the activities for the visits imported
    if (guidsToDelete[0].imported_guids.activities.length > 0) {
      try {
        let deletion = await axios.delete(
          `${process.env.AQI_BASE_URL}/v1/activities?ids=${guidsToDelete[0].imported_guids.activities}`,
          {
            headers: {
              Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
              "x-api-key": process.env.AQ,
            },
          },
        );
        console.log("AQI ACTIVITY DELETION: " + deletion.data);

        try {
          const dbDeletion = await this.prisma.aqi_field_activities.deleteMany({
            where: {
              aqi_field_activities_id: {
                in: guidsToDelete[0].imported_guids.activities,
              },
            },
          });
          console.log("DB ACTIVITY DELETION: " + dbDeletion);
        } catch (err) {
          this.logger.error(`API call to delete DB activities failed: `, err);
        }
      } catch (err) {
        this.logger.error(`API call to delete DB activity failed: `, err);
      }
    }

    // Delete all the visits for the visits imported
    if (guidsToDelete[0].imported_guids.visits.length > 0) {
      try {
        let deletion = await axios.delete(
          `${process.env.AQI_BASE_URL}/v1/fieldvisits?ids=${guidsToDelete[0].imported_guids.visits}`,
          {
            headers: {
              Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
              "x-api-key": process.env.AQI_ACCESS_TOKEN,
            },
          },
        );
        console.log("AQI VISIT DELETION: " + deletion.data);

        try {
          const dbDeletion = await this.prisma.aqi_field_visits.deleteMany({
            where: {
              aqi_field_visits_id: {
                in: guidsToDelete[0].imported_guids.visits,
              },
            },
          });
          console.log("DB VISIT DELETION: " + dbDeletion);
        } catch (err) {
          this.logger.error(`API call to delete DB visits failed: `, err);
        }
      } catch (err) {
        this.logger.error(`API call to delete AQI visit failed: `, err);
      }
    }

    await this.prisma.aqi_imported_data.deleteMany({
      where: {
        file_name: fileName,
      },
    });
  }
}
