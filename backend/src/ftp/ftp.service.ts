import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import * as ftp from "basic-ftp";
import * as path from "path";
import * as dotenv from "dotenv";
import { Writable } from "stream";
import { FtpFileValidationService } from "./ftp_file_validation.service";

dotenv.config();

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);
  private client: ftp.Client;
  private remoteBasePath: string;

  constructor(private ftpFileValidationService: FtpFileValidationService) {
    this.client = new ftp.Client();
    this.client.ftp.verbose = true;
    this.remoteBasePath = process.env.FTP_PATH;
    this.client.ftp.log = this.logger.debug;
  }

  async connect() {
    try {
      await this.client.access({
        host: process.env.FTP_HOST,
        port: parseInt(process.env.FTP_PORT),
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: true,
        secureOptions: { rejectUnauthorized: false },
      });
      // check the base path where user folders should be
      // note - this also tries to create the directories and will display a harmless error in the console because of this
      await this.client.ensureDir(this.remoteBasePath);

      this.logger.log("Connected to FTP server");
    } catch (error) {
      this.logger.error("Failed to connect to FTP server", error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.close();
    this.logger.log("Disconnected from FTP server");
  }

  /**
   * Checks each user folder for files, passing them to validation,
   * and removing them from the ftp server.
   */
  async scanAndProcessFolders() {
    try {
      const folders: ftp.FileInfo[] = await this.client.list(
        this.remoteBasePath
      );

      this.logger.log(`~~~~~`);
      for (const folder of folders) {
        if (folder.isDirectory) {
          const folderPath: string = path.join(
            this.remoteBasePath,
            folder.name
          );
          const files: ftp.FileInfo[] = await this.client.list(folderPath);

          for (const file of files) {
            if (file.isFile) {
              const filePath: string = path.join(folderPath, file.name);
              this.logger.log(`Processing file: ${filePath}`);

              const fileExtension = path
                .extname(filePath)
                .toLowerCase()
                .replace(".", "");

              const dataBuffer = [];

              const writableStream = new Writable({
                write(chunk, encoding, callback) {
                  dataBuffer.push(chunk);
                  callback();
                },
              });
              try {
                await this.client.downloadTo(writableStream, filePath);
                const fileBuffer = Buffer.concat(dataBuffer);
                // pass file buffer to validation
                const errors: string[] =
                  await this.ftpFileValidationService.processFile(
                    fileBuffer,
                    fileExtension
                  );
                if (errors.length > 0) {
                  this.logger.log(`Validation failure for: ${filePath}`);
                  errors.forEach((error) => this.logger.log(error));
                  this.logger.log(``);
                  // send out a notification to the file submitter & ministry contact outlining the errors
                  const username = folder.name;
                  this.logger.log(`Notifying ${username} of error`);
                } else {
                  this.logger.log(`Validation success for: ${filePath}`);
                  this.logger.log(``);
                  // pass to file validation service
                }
                // this.logger.log(`Cleaning up file: ${filePath}`);
                // await this.client.remove(filePath);
              } catch (error) {
                this.logger.error(
                  "Error during file download or processing",
                  error
                );
              }
            }
          }
          this.logger.log(`~~~~~`);
        }
      }
    } catch (error) {
      this.logger.error("Error scanning and processing folders", error);
      throw error;
    }
  }

  // Running every 5 minutes
  @Cron("* */5 * * * *")
  async handleCron() {
    this.logger.log("START ################");
    this.logger.log("######################");
    this.logger.log("Cron job started");
    try {
      await this.connect();
      await this.scanAndProcessFolders();
    } catch (error) {
      this.logger.error("Error in cron job", error);
    } finally {
      await this.disconnect();
      this.logger.log("######################");
      this.logger.log("END ##################");
    }
  }
}
