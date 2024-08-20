import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as fs from "fs";

@Injectable()
export class AqiApiService {
  private readonly logger = new Logger(AqiApiService.name);
  private axiosInstance: AxiosInstance;

  constructor() {
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

  async importObservations(fileName: any) {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(fileName));
    try {
      const response = await axios.post(`${process.env.AQI_BASE_URL}/v2/observationimports/dryrun?fileType=SIMPLE_CSV&timeZoneOffset=-08:00&linkFieldVisitsForNewObservations=true`, formData, {
        headers: {
          "Content-Type": "multipart/form-data; boundary=<calculated when request is sent>",
        }
      });
      this.logger.log(`API call to Observations succeeded: ${response.status}`);
      return response.data.id;
    } catch (err) {
      console.error(
        "API CALL TO Observations failed: ",
        err,
      );
    }
  }
}
