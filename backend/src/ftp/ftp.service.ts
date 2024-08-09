import { Injectable, Logger } from '@nestjs/common';
import * as ftp from 'basic-ftp';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PassThrough } from 'stream';

dotenv.config();

@Injectable()
export class FtpService {
    private readonly logger = new Logger(FtpService.name);
    private client: ftp.Client;
    private remoteBasePath: string;
    
    constructor(
        // private fileValidationService: FileValidationService
    ) {
        this.client = new ftp.Client();
        this.client.ftp.verbose = true;
        this.remoteBasePath = process.env.FTP_PATH;
  }

  async connect() {
    try {
      await this.client.access({
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: true,
      });
      // debug - log list of folders
      this.logger.log(await this.client.list())
      // check the base path where user folders should be
      await this.client.ensureDir(this.remoteBasePath)

      this.logger.log('Connected to FTP server');
    } catch (error) {
      this.logger.error('Failed to connect to FTP server', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.close();
    this.logger.log('Disconnected from FTP server');
  }

  /**
   * Checks each user folder for files, passing them to validation, 
   * and removing them from the ftp server.
   */
  async scanAndProcessFolders() {
    try {
      const folders: ftp.FileInfo[] = await this.client.list(this.remoteBasePath);

      for (const folder of folders) {
        if (folder.isDirectory) {
          const folderPath: string = path.join(this.remoteBasePath, folder.name);
          this.logger.log(`Processing folder: ${folderPath}`);

          const files: ftp.FileInfo[] = await this.client.list(folderPath);

          for (const file of files) {
            if (file.isFile) {
              const filePath: string = path.join(folderPath, file.name);

              this.logger.log(`Processing file: ${filePath}`);
              const fileStream = new PassThrough();
              this.client.downloadTo(fileStream, filePath).then(async () => {
                // Pass file directly to the file validation service
                // await this.fileValidationService.processFile(localFilePath);

                this.logger.log(`Cleaning up file: ${filePath}`);
                await this.client.remove(filePath);
              }).catch((error) => {
                this.logger.error('Error during file download or processing', error);
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error scanning and processing folders', error);
      throw error;
    }
  }
}
