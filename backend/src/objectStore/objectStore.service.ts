import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as crypto from "crypto";
import * as fs from "fs";

@Injectable()
export class ObjectStoreService {
  private readonly logger = new Logger(ObjectStoreService.name);

  private readonly objectStoreEndpoint = process.env.OBJECTSTORE_URL;
  private readonly accessKey = process.env.OBJECTSTORE_ACCESS_KEY;
  private readonly secretKey = process.env.OBJECTSTORE_SECRET_KEY;
  private readonly bucketName = process.env.OBJECTSTORE_BUCKET;
  private readonly backupDirectory = process.env.OBJECTSTORE_BUCKET_NAME;

  async getFileData(fileName: string) {
    try {
      if (!this.objectStoreEndpoint) {
        throw new Error("Object store endpoint not defined.");
      }

      const dateValue = new Date().toUTCString();

      const stringToSign = `GET\n\n\n${dateValue}\n/${this.bucketName}/${fileName}`;

      const signature = crypto
        .createHmac("sha1", this.secretKey)
        .update(stringToSign)
        .digest("base64");

      const requestUrl = `${this.objectStoreEndpoint}/${this.bucketName}/${fileName}`;

      const headers = {
        Authorization: `AWS ${this.accessKey}:${signature}`,
        Date: dateValue,
      };

      const response = await axios({
        method: "get",
        url: requestUrl,
        headers: headers,
        responseType: "arraybuffer", // This is important for binary data
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching the file:", error.message);
      // throw error;
    }
  }
}
