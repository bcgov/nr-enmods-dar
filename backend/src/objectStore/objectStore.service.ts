import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import * as fs from "fs";

@Injectable()
export class ObjectStoreService {
  private readonly logger = new Logger(ObjectStoreService.name);

  private readonly objectsotreEndpoint = process.env.OBJECTSTORE_URL;
  private readonly accessKey = process.env.OBJECTSTORE_ACCESS_KEY;
  private readonly secretKey = process.env.OBJECTSTORE_SECRET_KEY;
  private readonly bucketName = process.env.OBJECTSTORE_BUCKET;
  private readonly backupDirectory = process.env.OBJECTSTORE_BUCKET_NAME;

  async getFileData(fileName: string) {
    try{
      if (!this.objectsotreEndpoint) {
        throw new Error("Object store endpoint not defined.");
      }
  
      const dateValue = new Date().toUTCString();
  
      const stringToSign = `GET\n\n\n${dateValue}\n/${this.bucketName}/${fileName}`;
  
      const signature = crypto
        .createHmac("sha1", this.secretKey)
        .update(stringToSign)
        .digest("base64");
  
      const requestUrl = `${this.objectsotreEndpoint}/${this.bucketName}/${fileName}`
  
      const headers = {
        'Authorization': `AWS ${this.accessKey}:${signature}`,
        'Date': dateValue,
      };
      
      // getting the file as a stream from the object store 
      const response = await axios({
        method: 'get',
        url: requestUrl,
        headers: headers,
        responseType: 'stream',
      })
      
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching the file:', error.message);
      throw error;
    }
  }
}
