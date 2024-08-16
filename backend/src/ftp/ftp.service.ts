import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import * as ftp from "basic-ftp";
import * as path from "path";
import * as dotenv from "dotenv";
import { Writable } from "stream";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "nestjs-prisma";
import { FileValidationService } from "src/file_validation/file_validation.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";

dotenv.config();

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);
  private client: ftp.Client;
  private remoteBasePath: string;

  constructor(
    private fileValidationService: FileValidationService,
    private notificationsService: NotificationsService,
    private fileSubmissionsService: FileSubmissionsService,
  ) {
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
        this.remoteBasePath,
      );

      this.logger.log(`~~~~~`);
      for (const folder of folders) {
        if (folder.isDirectory) {
          const folderPath: string = path.join(
            this.remoteBasePath,
            folder.name,
          );
          const files: ftp.FileInfo[] = await this.client.list(folderPath);

          for (const file of files) {
            if (file.isFile) {
              const filePath: string = path.join(folderPath, file.name);
              this.logger.log(`Processing file: ${filePath}`);

              try {
                let errors: string[] = [];
                // if the file is > 10MB, don't download it
                if (file.size > 10 * 1024 * 1024) {
                  errors = ["File size exceeds the limit of 10MB."];
                  // don't download the file, just send out a notification of the error
                  const ministryContact = ""; // should be obtained from file somehow
                  await this.notificationsService.notifyFtpUserOfError(
                    folder.name,
                    file.name,
                    errors,
                    ministryContact,
                  );
                } else {
                  const dataBuffer = [];
                  // download file to a stream that puts chunks into an array
                  const writableStream = new Writable({
                    write(chunk, encoding, callback) {
                      dataBuffer.push(chunk);
                      callback();
                    },
                  });
                  // download file to the writable stream
                  await this.client.downloadTo(writableStream, filePath);
                  // convert chunk array to buffer
                  const fileBuffer = Buffer.concat(dataBuffer);
                  // pass file buffer to file submission service to be uploaded to comms & have submission entry created
                  // await this.fileSubmissionsService.parseFileFromFtp(
                  //   fileBuffer,
                  //   folder.name,
                  //   file.name,
                  //   filePath,
                  // );
                  // debug
                  await this.fileValidationService.processFile(
                    fileBuffer,
                    filePath,
                    folder.name, // username
                    file.name,
                  );
                }
                // if (errors.length > 0) {
                //   this.logger.log(`Validation failure for: ${filePath}`);
                //   errors.forEach((error) => this.logger.log(error));
                //   this.logger.log(``);
                //   // send out a notification to the file submitter & ministry contact outlining the errors
                //   const ministryContact = ""; // should be obtained from file somehow
                //   await this.notifyUserOfError(
                //     folder.name,
                //     file.name,
                //     errors,
                //     ministryContact,
                //   );
                // } else {
                //   this.logger.log(`Validation success for: ${filePath}`);
                //   this.logger.log(``);
                //   // pass to file validation service
                //   // await this.validationService.handleFile(file); // made up function call
                // }
                // this.logger.log(`Cleaning up file: ${filePath}`);
                // await this.client.remove(filePath);
              } catch (error) {
                this.logger.error(
                  "Error during file download or processing",
                  error,
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

  // @Cron("0 */5 * * * *") // every 5 minutes
  @Cron("0,15,30,45 * * * * *") // every 15s
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
