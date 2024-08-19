import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import * as crypto from 'crypto';
import * as fs from 'fs';

@Injectable()
export class ObjectStoreService {
  private readonly logger = new Logger(ObjectStoreService.name);

  private readonly objectsotreEndpoint = process.env.OBJECTSTORE_URL;
  private readonly accessKey = process.env.OBJECTSTORE_ACCESS_KEY;
  private readonly secretKey = process.env.OBJECTSTORE_SECRET_KEY;
  private readonly bucketName = process.env.OBJECTSTORE_BUCKET;
  private readonly backupDirectory = process.env.OBJECTSTORE_BUCKET_NAME;

  async getFileData(submission_id: string) {
    if (!this.objectsotreEndpoint){
      throw new Error("Object store endpoint not defined.");
    }

    const filenameWithExtension = 'TEST_MASTER_FILE-dc77af44-e300-45fc-b048-904f15e7a503.xlsx';

    // Generate timestamp for signing the request
    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '') + 'Z';

    // Generate the signature for the request
    const stringToSign = `GET\n\n\n${date}\n/${this.bucketName}/${this.backupDirectory}/${filenameWithExtension}`;
    const signature = crypto.createHmac('sha1', this.secretKey)
                            .update(stringToSign)
                            .digest('base64');

    // Construct the URL
    const url = `https://${this.objectsotreEndpoint}/${this.bucketName}/${this.backupDirectory}/${filenameWithExtension}`;

    // // Perform the file download using Axios
    const response = await axios.get(url, {
      responseType: 'arraybuffer', // Important to handle binary data correctly
      headers: {
        // 'Host': this.objectsotreEndpoint,
        'Date': date,
        'Authorization': `AWS ${this.accessKey}:${signature}`,
      },
    });

    console.log('*******************************************************************');
    fs.writeFile('./temp.txt', response.data, (err) => {
      if (err){
        console.error(err);
      }else{
        console.log('File saved!');
      }
    })
    console.log('*******************************************************************');
  }
}

