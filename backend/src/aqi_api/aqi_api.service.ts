import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

@Injectable()
export class AqiApiService {
  private readonly logger = new Logger(AqiApiService.name);
  private axiosInstance: AxiosInstance

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.AQI_BASE_URL,
      headers: {
        'Authorization': `token ${process.env.AQI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'x-api-key': process.env.AQI_ACCESS_TOKEN
      }
    });
  }
  
  async fieldVisits(body: any){
    try{
        const response = await this.axiosInstance.post("/v1/fieldvisits", body);
        this.logger.log(`API call to Field Visits succeeded: ${response.status}`);
        return response.data.id;
    }catch(err){
        console.error("API CALL TO Field Visits failed: ", err);
    }
  }

  async fieldActivities(body: any){
    try{
        const response = await this.axiosInstance.post("/v1/activities", body);
        this.logger.log(`API call to Activities succeeded: ${response.status}`);
        return response.data.id;
    }catch(err){
        console.error("API CALL TO Activities failed: ", err);
    }
  }
}
