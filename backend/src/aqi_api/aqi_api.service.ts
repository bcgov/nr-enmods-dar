import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import { PrismaService } from "nestjs-prisma";
import path from "path";
import { Cron, CronExpression } from "@nestjs/schedule";
import { JsonValue } from "@prisma/client/runtime/library";

@Injectable()
export class AqiApiService {
  private readonly logger = new Logger(AqiApiService.name);
  private axiosInstance: AxiosInstance;
  private goodObservationImporStatus: boolean = false;

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

  async healthCheck() {
    const healthcheckUrl = process.env.AQI_BASE_URL + "/v1/status";
    let aqiStatus = (await axios.get(healthcheckUrl)).status;

    return aqiStatus;
  }

  async fieldVisits(rowNumber: number, body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/fieldvisits", body);
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to POST Field Visits succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO POST Field Visits failed, resulting in partial upload for the file: `,
        err.response.data.message,
      );

      return ["partialUpload", err.response.data.message];
    }
  }

  async getFieldVisits(rowNumber: number, url: any) {
    try {
      const response = await this.axiosInstance.get(url);
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to GET Field Visits succeeded: ${response.status}`,
      );

      let urlAndResponse = {
        id: rowNumber,
        url: url,
        count: response.data.totalCount,
        GUID:
          response.data.domainObjects.length > 0
            ? response.data.domainObjects[0].id
            : null,
      };
      return urlAndResponse;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO GET Field Visits failed: `,
        err.response.data.message,
      );
      return err.response.data.message
    }
  }

  async getActivities(rowNumber: number, url: any) {
    try {
      const response = await this.axiosInstance.get(url);
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to GET Activities succeeded: ${response.status}`,
      );

      let urlAndResponse = {
        id: rowNumber,
        url: url,
        count: response.data.totalCount,
        GUID:
          response.data.domainObjects.length > 0
            ? response.data.domainObjects[0].id
            : null,
      };
      return urlAndResponse;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO GET Activities failed: `,
        err.response.data.message,
      );
    }
  }

  async putFieldVisits(rowNumber: number, GUID: string, body: any) {
    try {
      const response = await this.axiosInstance.put(
        `/v1/fieldvisits/${GUID}`,
        body,
      );
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to PUT Field Visits succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO PUT Field Visits failed: `,
        err.response.data.message,
      );
    }
  }

  async fieldActivities(rowNumber: number, body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/activities", body);
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to POST Activities succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO POST Activities failed, resulting in partial upload for the file: `,
        err.response.data.message,
      );

      return ["partialUpload", err.response.data.message];
    }
  }

  async putFieldActivities(rowNumber: number, GUID: string, body: any) {
    try {
      const response = await this.axiosInstance.put(
        `/v1/activities/${GUID}`,
        body,
      );
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to PUT Field Activities succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO PUT Field Activities failed: `,
        err.response.data.message,
      );
    }
  }

  async fieldSpecimens(rowNumber: number, body: any) {
    try {
      const response = await this.axiosInstance.post("/v1/specimens", body);
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to POST Specimens succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      const message = err.response.data.message;

      const skipMessage =
        "A Specimen with the same name already exists for the referenced Activity";

      if (message == skipMessage) {
        this.logger.warn(
          `RowNum: ${rowNumber} -> Duplicate Specimen name, skipping...`,
        );
        return "exists";
      } else {
        this.logger.error(
          `RowNum: ${rowNumber} -> API CALL TO POST Specimens failed, resulting in partial upload for the file: `,
          err.response.data.message,
        );

        return ["partialUpload", err.response.data.message];
      }
    }
  }

  async putSpecimens(rowNumber: number, GUID: string, body: any) {
    try {
      const response = await this.axiosInstance.put(
        `/v1/specimens/${GUID}`,
        body,
      );
      this.logger.log(
        `RowNum: ${rowNumber} -> API call to PUT Specimens succeeded: ${response.status}`,
      );
      return response.data.id;
    } catch (err) {
      this.logger.error(
        `RowNum: ${rowNumber} -> API CALL TO PUT Specimens failed: `,
        err.response.data.message,
      );
    }
  }

  async getObservationsFromFile(fileName: string) {
    try {
      let allObservationsFromFile = [];
      let cursor: string | null = null;
      let total = 0;
      let processedCount = 0;
      let loopCount = 0;

      do {
        const url = cursor
          ? `/v2/observations?EA_Upload%20File%20Name=${fileName}&cursor=${cursor}`
          : `/v2/observations?EA_Upload%20File%20Name=${fileName}`;

        const response = await this.axiosInstance.get(url);

        if (response.status != 200) {
          this.logger.error(
            `Could not ping AQI API for observations. Response Code: ${response.status}`,
          );
          return;
        }

        const entries = response.data.domainObjects || [];
        const relatedData = entries.map((observation) => observation.id);
        cursor = response.data.cursor || null;
        total = response.data.totalCount || 0;

        this.logger.log(
          `Fetched ${entries.length} entries from observations. Processed: ${processedCount}/${total}`,
        );

        allObservationsFromFile.push(...relatedData);

        // Increment counters
        processedCount += entries.length;
        loopCount++;

        // Log progress periodically
        if (loopCount % 5 === 0 || processedCount >= total) {
          this.logger.log(`Progress: ${processedCount}/${total}`);
        }

        // Break if we've processed all expected entries
        if (processedCount >= total) {
          this.logger.log(`Completed fetching data for observations`);
          break;
        }

        // Edge case: Break if no entries are returned but the cursor is still valid
        if (entries.length === 0 && cursor) {
          this.logger.warn(
            `Empty response for observations with cursor ${cursor}. Terminating early.`,
          );
          break;
        }
      } while (cursor);

      return allObservationsFromFile;
    } catch (err) {
      this.logger.error("API CALL TO GET Observations from File failed: ", err);
    }
  }

  async cleanObsURLS(){
    const URLsToClean = await this.prisma.aqi_obs_status.findMany({
      where:{
        active_ind: true
      }
    });

    for (const url of URLsToClean){
      await this.prisma.aqi_obs_status.update({
        where: {
          aqi_obs_status_id: url.aqi_obs_status_id
        }, 
        data: {
          active_ind: false
        }
      })
    }
  }

  async importObservations(
    fileName: any,
    method: string,
    fileSubmissionId: string,
    fileOperationCode: string,
  ) {
    const formData = new FormData();
    const fileStream = fs.createReadStream(path.resolve(fileName));
    formData.append("file", fileStream, path.basename(fileName));
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
        const obs_status_data = {
          file_submission_id: fileSubmissionId,
          file_name: fileName,
          file_operation: fileOperationCode,
          status_url: statusURL,
          create_utc_timestamp: new Date(),
        };

        await this.prisma.aqi_obs_status.create({
          data: obs_status_data,
        });

        const resultURL = await this.waitForObsStatus();
        
        if (resultURL === null) {
          this.logger.error("Observation status check timed out, returning timeout error");
          const timeoutErrorLog = JSON.parse(`{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Observation status check timed out after 1 hour. Please try again later."}}`);
          return [timeoutErrorLog];
        }

        const obsStatus = await this.getObsResult(resultURL);

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
        const obs_status_data = {
          file_submission_id: fileSubmissionId,
          file_name: fileName,
          file_operation: fileOperationCode,
          status_url: statusURL,
          create_utc_timestamp: new Date(),
        };

        await this.prisma.aqi_obs_status.create({
          data: obs_status_data,
        });

        const resultURL = await this.waitForObsStatus();

        const obsStatus = await this.getObsResult(resultURL);

        const errorMessages = this.parseObsResultResponse(obsStatus);
        return errorMessages;
      }
    } catch (err) {
      // uncheck any valid obs URLs in the database
      await this.cleanObsURLS();
      this.logger.error("API call to Observation Import failed: ", err);
      const errorLog = JSON.parse(`{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Observation API call to status/result failed. Please re-upload the file."}}`);
      return [errorLog]
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async getObservationImportStatus() {
    axios.defaults.method = "GET";
    axios.defaults.headers.common["Authorization"] =
      "token " + process.env.AQI_ACCESS_TOKEN;
    axios.defaults.headers.common["x-api-key"] = process.env.AQI_ACCESS_TOKEN;

    const statusURL = await this.prisma.aqi_obs_status.findFirst({
      select: {
        aqi_obs_status_id: true,
        status_url: true,
      },
      where: {
        active_ind: true,
      },
      orderBy: {
        create_utc_timestamp: "desc",
      },
    });

    if (statusURL !== null && statusURL !== undefined) {
      try {
        const response = await axios.get(statusURL.status_url, {
          headers: {
            Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
            "x-api-key": process.env.AQI_ACCESS_TOKEN,
          },
        });

        if (!response.data.hasOwnProperty("importProcessorTransactionStatus")) {
          const resultURL = statusURL.status_url.replace("status", "result");

          await this.prisma.$transaction(async (prisma) => {
            const updateStatus = await this.prisma.aqi_obs_status.update({
              where: {
                aqi_obs_status_id: statusURL.aqi_obs_status_id,
              },
              data: {
                result_url: resultURL,
              },
            });
          });

          await this.prisma.$transaction(async (prisma) => {
            const updateStatus = await this.prisma.aqi_obs_status.update({
              where: {
                aqi_obs_status_id: statusURL.aqi_obs_status_id,
              },
              data: {
                active_ind: false,
              },
            });
          });

          this.goodObservationImporStatus = true;
          this.logger.log("CHECKED OBSERVATION STATUS");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError;
          if (axiosError.response?.status === 409) {
            this.logger.warn("409 Conflict: Errors found in observation file");
            const resultURL = statusURL.status_url.replace(
              /(.*?)(\/api.*)/,
              (_, base) => base + err.request.path,
            );

            await this.prisma.$transaction(async (prisma) => {
              const updateStatus = await this.prisma.aqi_obs_status.update({
                where: {
                  aqi_obs_status_id: statusURL.aqi_obs_status_id,
                },
                data: {
                  result_url: resultURL,
                },
              });
            });

            this.goodObservationImporStatus = true;
            this.logger.log("CHECKED OBSERVATION STATUS");
          } else if (axiosError.response.status === 400) {
            this.logger.warn(
              `Error with observation subfile: ${axiosError.response.data as { message: string }}`,
            );
            await this.prisma.$transaction(async (prisma) => {
              const updateStatus = await this.prisma.aqi_obs_status.update({
                where: {
                  aqi_obs_status_id: statusURL.aqi_obs_status_id,
                },
                data: {
                  active_ind: false,
                },
              });
            });
            this.goodObservationImporStatus = true;
          } else {
            this.logger.error(
              "API CALL TO Observations Status failed: ",
              err.response,
            );

            await this.prisma.$transaction(async (prisma) => {
              const updateStatus = await this.prisma.aqi_obs_status.update({
                where: {
                  aqi_obs_status_id: statusURL.aqi_obs_status_id,
                },
                data: {
                  active_ind: false,
                },
              });
            });
            this.goodObservationImporStatus = true;
          }
        }
      }
    }
  }

  async waitForObsStatus() {
    const startTime = Date.now();
    const timeoutMs = 60 * 60 * 1000; // 1 hour in milliseconds
    
    while (!this.goodObservationImporStatus) {
      this.logger.log("WAITING TO CHECK OBSERVATION STATUS");
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime >= timeoutMs) {
        this.logger.error("TIMEOUT: Waited for observation status for 1 hour, exiting");
        return null; // Return null instead of throwing error
      }
      
      this.logger.log(`WAITING TO CHECK OBSERVATION STATUS (${Math.floor(elapsedTime / 1000)}s elapsed)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const resultURL = await this.prisma.aqi_obs_status.findFirst({
      select: {
        aqi_obs_status_id: true,
        result_url: true,
      },
      orderBy: {
        create_utc_timestamp: "desc",
      },
    });

    this.goodObservationImporStatus = false;
    return resultURL;
  }

  async getObsResult(resultURL: any) {
    try {
      const obsResultResponse = await axios.get(resultURL.result_url, {
        headers: {
          Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
          "x-api-key": process.env.AQI_ACCESS_TOKEN,
        },
      });

      this.logger.log(
        `API call to Observations Result succeeded: ${obsResultResponse.status}`,
      );
      return obsResultResponse;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;

        await this.prisma.$transaction(async (prisma) => {
          const updateStatus = await this.prisma.aqi_obs_status.update({
            where: {
              aqi_obs_status_id: resultURL.aqi_obs_status_id,
            },
            data: {
              active_ind: false,
            },
          });
        });

        if (axiosError.response?.status === 409) {
          this.logger.warn("409 Conflict: Errors found in observation file");
          return axiosError.response.data;
        }
      }
    }
  }

  parseObsResultResponse(obsResults: any) {
    let errorMessages = [];
    if (obsResults.errorCount > 0) {
      obsResults.importItems.forEach((item) => {
        const rowId = item.rowId;
        const errorList = item.errors;

        for (const [key, errors] of Object.entries(errorList)) {
          if (errors[0].errorMessage) {
            let ObservationFile = errors[0]?.errorFieldValue
              ? `${errors[0].errorMessage} : ${errors[0].errorFieldValue}`
              : `${errors[0].errorMessage}`;
            errorMessages.push({
              rowNum: parseInt(rowId),
              type: "ERROR",
              message: {
                ObservationFile,
              },
            });
          }
        }
      });
    }
    return errorMessages;
  }

  async databaseLookup(dbTable: string, queryParam: string) {
    switch (dbTable) {
      case "aqi_units":
        try {
          let result = await this.prisma.aqi_units.findMany({
            where: {
              edt_unit: queryParam,
            },
            select: {
              custom_id: true,
            },
          });
          if (result.length > 0) {
            return result[0];
          } else {
            return null;
          }
        } catch (err) {
          this.logger.error(`API CALL TO ${dbTable} failed: `, err);
        }
      case "aqi_observed_properties":
        try {
          let result = await this.prisma.aqi_observed_properties.findMany({
            where: {
              custom_id: queryParam,
            },
            select: {
              result_type: true
            }
          });
          if (result.length > 0) {
            return result;
          } else {
            return null;
          }
        } catch (err) {
          this.logger.error(`API CALL TO ${dbTable} failed: `, err);
        }
      default:
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
    const map = new Map<string, any>();

    const mergeItem = (item: any) => {
      const key = `${item.rowNum}-${item.type}`;
      const exists = map.get(key);
      map.set(
        key,
        exists
          ? { ...exists, message: { ...exists.message, ...item.message } }
          : item,
      );
    };

    [...localErrors, ...remoteErrors].forEach(mergeItem);

    return Array.from(map.values()).sort((a, b) => a.rowNum - b.rowNum);
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

  async ObservationDelete(obsData: any[], obsDeleteErrors: any[]) {
    if (obsData.length > 0) {
      for (let i = 0; i < obsData.length; i++) {
        try {
          let deletion = await axios.delete(
            `${process.env.AQI_BASE_URL}/v2/observations/${obsData[i]}`,
            {
              headers: {
                Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
                "x-api-key": process.env.AQI_ACCESS_TOKEN,
              },
            },
          );
          this.logger.log("AQI OBS DELETION: " + deletion.status);
        } catch (err) {
          let obsError = `{"rowNum": "N/A", "type": "ERROR", "message": {"Delete": "Failed to delete observation with GUID ${obsData[i]}"}}`;
          obsDeleteErrors.push(JSON.parse(obsError));
          this.logger.error(`API call to delete AQI observation failed: `, err);
        }
      }
    }
    // await new Promise((f) => setTimeout(f, 1000));

    return obsDeleteErrors;
  }

  async SpecimenDelete(specimenData: any[], specimenDeleteErrors: any[]) {
    if (specimenData.length > 0) {
      for (const specimen of specimenData) {
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
          this.logger.log("AQI SPECIMEN DELETION: " + aqiDeletion.status);
        } catch (err) {
          let specimenError = `{"rowNum": "N/A", "type": "ERROR", "message": {"Delete": "Failed to delete specimen with GUID ${specimen}"}}`;
          specimenDeleteErrors.push(JSON.parse(specimenError));
          this.logger.error(`API call to delete AQI specimen failed: `, err);
        }
      }
    }
    // await new Promise((f) => setTimeout(f, 1000));
    return specimenDeleteErrors;
  }

  async ActivityDelete(activityData: any[], activityDeleteErrors: any[]) {
    if (activityData.length > 0) {
      for (const activity of activityData) {
        try {
          let aqiDeletion = await axios.delete(
            `${process.env.AQI_BASE_URL}/v1/activities/${activity}`,
            {
              headers: {
                Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
                "x-api-key": process.env.AQI_ACCESS_TOKEN,
              },
            },
          );
          this.logger.log("AQI ACTIVITY DELETION: " + aqiDeletion.status);
        } catch (err) {
          let activityError = `{"rowNum": "N/A", "type": "ERROR", "message": {"Delete": "Failed to delete activity with GUID ${activity}"}}`;
          activityDeleteErrors.push(JSON.parse(activityError));
          this.logger.error(`API call to delete AQI activity failed: `, err);
        }
      }
    }
    // await new Promise((f) => setTimeout(f, 1000));
    return activityDeleteErrors;
  }

  async VisitDelete(visitData: any[], visitDeleteErrors: any[]) {
    if (visitData.length > 0) {
      for (const visit of visitData) {
        try {
          let deletion = await axios.delete(
            `${process.env.AQI_BASE_URL}/v1/fieldvisits/${visit}`,
            {
              headers: {
                Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
                "x-api-key": process.env.AQI_ACCESS_TOKEN,
              },
            },
          );
          this.logger.log("AQI VISIT DELETION: " + deletion.status);
        } catch (err) {
          let visitError = `{"rowNum": "N/A", "type": "ERROR", "message": {"Delete": "Failed to delete visit with GUID ${visit}"}}`;
          visitDeleteErrors.push(JSON.parse(visitError));
          this.logger.error(`API call to delete AQI visit failed: `, err);
        }
      }
    }
    // await new Promise((f) => setTimeout(f, 1000));
    return visitDeleteErrors;
  }

  async deleteRelatedData(fileName: string, submission_id: string) {
    const guidsToDelete: any = await this.prisma.aqi_imported_data.findMany({
      where: {
        file_name: fileName,
      },
    });

    let deleteErrors = [];

    let successfulObs = false;
    let successfulSpecimen = false;
    let successfulActivity = false;
    let successfulVisit = false;

    // Delete all the observations in AQI that are in the list of imported guids
    this.logger.log(
      `Starting observation delete for file ${fileName}..............`,
    );

    await this.ObservationDelete(
      guidsToDelete[0].imported_guids.observations,
      deleteErrors,
    ).then(() => {
      successfulObs = true;
      this.logger.log(`Finished observation delete for file ${fileName}`);
    });

    if (successfulObs) {
      // Delete all the specimens that were imported for the file from AQI and the PSQL db
      this.logger.log(
        `Starting specimen delete for file ${fileName}..............`,
      );
      await this.SpecimenDelete(
        guidsToDelete[0].imported_guids.specimens,
        deleteErrors,
      ).then(() => {
        successfulSpecimen = true;
        this.logger.log(`Finished specimen delete for file ${fileName}.`);
      });
    }

    if (successfulSpecimen) {
      // Delete all the activities for the visits imported
      this.logger.log(
        `Starting activity delete for file ${fileName}..............`,
      );
      await this.ActivityDelete(
        guidsToDelete[0].imported_guids.activities,
        deleteErrors,
      ).then(() => {
        successfulActivity = true;
        this.logger.log(`Finished activity delete for file ${fileName}.`);
      });
    }

    if (successfulActivity) {
      // Delete all the visits for the visits imported
      this.logger.log(
        `Starting visit delete for file ${fileName}..............`,
      );
      await this.VisitDelete(
        guidsToDelete[0].imported_guids.visits,
        deleteErrors,
      ).then(() => {
        successfulVisit = true;
        this.logger.log(`Finished visit delete for file ${fileName}.`);
      });
    }

    // get the file error logs
    const errorLogToUpdate = await this.prisma.file_error_logs.findMany({
      where: {
        file_submission_id: submission_id,
      },
      select: {
        file_error_log_id: true,
        error_log: true,
      },
    });

    let fileErrors = errorLogToUpdate.flatMap((item) =>
      Array.isArray(item.error_log) ? (item.error_log as any[]) : [],
    );

    // append all the delete errors found above to this list
    const finalErrorLogs = [...fileErrors, ...deleteErrors];
    await this.prisma.$transaction(async (prisma) => {
      await this.prisma.file_error_logs.update({
        where: {
          file_error_log_id: errorLogToUpdate[0].file_error_log_id,
        },
        data: {
          error_log: finalErrorLogs,
        },
      });
    });

    deleteErrors = [];
  }

  async getTaxons(taxon: string) {
    let returnedTaxon = {};
    const aqiTaxons = await this.axiosInstance.get("/v1/taxons");
    const matchingTaxon = aqiTaxons.data.domainObjects.find(
      (taxonElement) => taxonElement.scientificName === taxon,
    );

    if (matchingTaxon === undefined) {
      return returnedTaxon;
    } else {
      returnedTaxon["aqiId"] = matchingTaxon.id;
      returnedTaxon["customId"] = matchingTaxon.scientificName;

      return returnedTaxon;
    }
  }

  async getBioLifeStage(stageVlaue: string) {
    let returnedLifeStage = {};
    const lifeStages = await this.axiosInstance.get(
      "/v1/observedproperties/3f91be71-324c-48bf-8350-15e8f2f91743/categoricalvalues",
    );
    const matchingLifeStage = lifeStages.data.domainObjects.find(
      (lifeStageElement) => lifeStageElement.customId === stageVlaue,
    );

    if (matchingLifeStage === undefined) {
      return returnedLifeStage;
    } else {
      returnedLifeStage["aqiId"] = matchingLifeStage.id;
      returnedLifeStage["customId"] = matchingLifeStage.customId;

      return returnedLifeStage;
    }
  }

  async getBioSex(sexValue: string) {
    let returnedSexValue = {};
    const sexValues = await this.axiosInstance.get(
      "/v1/observedproperties/32b67848-86a4-4c8b-926c-3f034f59a1ad/categoricalvalues",
    );
    const matchingSexValue = sexValues.data.domainObjects.find(
      (sexValueElement) => sexValueElement.customId === sexValue,
    );

    if (matchingSexValue === undefined) {
      return returnedSexValue;
    } else {
      returnedSexValue["aqiId"] = matchingSexValue.id;
      returnedSexValue["customId"] = matchingSexValue.customId;

      return returnedSexValue;
    }
  }
}
