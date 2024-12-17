import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError, AxiosInstance } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import { PrismaService } from "nestjs-prisma";
import path from "path";
import { Cron, CronExpression } from "@nestjs/schedule";

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
  async importObservations(
    fileName: any,
    method: string,
    fileSubmissionId: string,
    fileOperationCode: string,
  ) {
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
      this.logger.error("API call to Observation Import failed: ", err);
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

    if (statusURL != null || statusURL != undefined) {
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
    while (!this.goodObservationImporStatus) {
      this.logger.log("WAITING TO CHECK OBSERVATION STATUS");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const resultURL = await this.prisma.aqi_obs_status.findFirst({
      select: {
        result_url: true,
      },
      orderBy: {
        create_utc_timestamp: "desc",
      },
    });

    this.goodObservationImporStatus = false;
    return resultURL.result_url;
  }

  async getObsResult(resultURL: string) {
    try {
      const obsResultResponse = await axios.get(resultURL, {
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
        if (axiosError.response?.status === 409) {
          this.logger.warn("409 Conflict: Continuing without failing");
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
      case "aqi_units_xref":
        try {
          let result = await this.prisma.aqi_units_xref.findMany({
            where: {
              edt_unit_xref: queryParam,
            },
            select: {
              aqi_units_code: true,
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

  async ObservationDelete(obsData: any[]) {
    if (obsData.length > 0) {
      const batchSize = 200;
      const observationBatches = [];
      for (let i = 0; i < obsData.length; i += batchSize) {
        observationBatches.push(obsData.slice(i, i + batchSize));
      }

      observationBatches.forEach(async (batch) => {
        try {
          let deletion = await axios.delete(
            `${process.env.AQI_BASE_URL}/v2/observations?ids=${batch}?limit=1000`,
            {
              headers: {
                Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
                "x-api-key": process.env.AQI_ACCESS_TOKEN,
              },
            },
          );
          this.logger.log("AQI OBS DELETION: " + deletion);
        } catch (err) {
          this.logger.error(`API call to delete AQI observation failed: `, err);
        }
      });
    }

    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async SpecimenDelete(specimenData: any[]) {
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
          this.logger.log("AQI SPECIMEN DELETION: " + aqiDeletion.data);

          try {
            const dbDeletion = await this.prisma.aqi_specimens.delete({
              where: {
                aqi_specimens_id: specimen,
              },
            });
            this.logger.log("DB SPECIMEN DELETION: " + dbDeletion);
          } catch (err) {
            if (err.code === "P2025") {
              this.logger.log(
                `Record with ID ${specimen} not found in DB. Record was deleted in AQI but skipping deletion from DB.`,
              );
            } else {
              this.logger.error(`API call to delete DB specimen failed: `, err);
            }
          }
        } catch (err) {
          this.logger.error(`API call to delete AQI specimen failed: `, err);
        }
      }
    }
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async ActivityDelete(activityData: any[]) {
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
          this.logger.log("AQI ACTIVITY DELETION: " + aqiDeletion.data);

          try {
            const dbDeletion = await this.prisma.aqi_field_activities.delete({
              where: {
                aqi_field_activities_id: activity,
              },
            });
            this.logger.log("DB ACTIVITY DELETION: " + dbDeletion);
          } catch (err) {
            if (err.code === "P2025") {
              this.logger.log(
                `Record with ID ${activity} not found in DB. Record was deleted in AQI but skipping deletion from DB.`,
              );
            } else {
              this.logger.error(`API call to delete DB activity failed: `, err);
            }
          }
        } catch (err) {
          this.logger.error(`API call to delete AQI activity failed: `, err);
        }
      }
    }
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async VisitDelete(visitData: any[]) {
    if (visitData.length > 0) {
      try {
        let deletion = await axios.delete(
          `${process.env.AQI_BASE_URL}/v1/fieldvisits?ids=${visitData}`,
          {
            headers: {
              Authorization: `token ${process.env.AQI_ACCESS_TOKEN}`,
              "x-api-key": process.env.AQI_ACCESS_TOKEN,
            },
          },
        );
        this.logger.log("AQI VISIT DELETION: " + deletion.data);

        try {
          const dbDeletion = await this.prisma.aqi_field_visits.deleteMany({
            where: {
              aqi_field_visits_id: {
                in: visitData,
              },
            },
          });
          this.logger.log("DB VISIT DELETION: " + dbDeletion);
        } catch (err) {
          if (err.code === "P2025") {
            this.logger.log(
              `Records with IDs ${visitData} not found in DB. Records were deleted in AQI but skipping deletion from DB.`,
            );
          } else {
            this.logger.error(`API call to delete DB visits failed: `, err);
          }
        }
      } catch (err) {
        this.logger.error(`API call to delete AQI visit failed: `, err);
      }
    }
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async deleteRelatedData(fileName: string) {
    const guidsToDelete: any = await this.prisma.aqi_imported_data.findMany({
      where: {
        file_name: fileName,
      },
    });

    // Delete all the observations in AQI that are in the list of imported guids
    this.logger.log(
      `Starting observation delete for file ${fileName}..............`,
    );
    await this.ObservationDelete(guidsToDelete[0].imported_guids.observations);
    this.logger.log(`Finished observation delete for file ${fileName}.`);

    // Delete all the specimens that were imported for the file from AQI and the PSQL db
    this.logger.log(
      `Starting specimen delete for file ${fileName}..............`,
    );
    await this.SpecimenDelete(guidsToDelete[0].imported_guids.specimen);
    this.logger.log(`Finished specimen delete for file ${fileName}.`);

    // Delete all the activities for the visits imported
    this.logger.log(
      `Starting activity delete for file ${fileName}..............`,
    );
    await this.ActivityDelete(guidsToDelete[0].imported_guids.activities);
    this.logger.log(`Finished activity delete for file ${fileName}.`);

    // Delete all the visits for the visits imported
    this.logger.log(`Starting visit delete for file ${fileName}..............`);
    await this.VisitDelete(guidsToDelete[0].imported_guids.visits);
    this.logger.log(`Finished visit delete for file ${fileName}.`);

    await this.prisma.aqi_imported_data.deleteMany({
      where: {
        file_name: fileName,
      },
    });
  }
}
