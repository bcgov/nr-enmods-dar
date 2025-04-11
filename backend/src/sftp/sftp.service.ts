import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import SFTPClient from "ssh2-sftp-client";
import * as dotenv from "dotenv";
import { NotificationsService } from "src/notifications/notifications.service";
import { PrismaService } from "nestjs-prisma";
import { FileValidationService } from "src/file_validation/file_validation.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";

dotenv.config();

@Injectable()
export class SftpService {
  private readonly logger = new Logger(SftpService.name);
  private client = new SFTPClient();
  private remoteBasePath: string;

  constructor(
    private prisma: PrismaService,
    private fileValidationService: FileValidationService,
    private notificationsService: NotificationsService,
    private fileSubmissionsService: FileSubmissionsService,
  ) {
    this.remoteBasePath = process.env.SFTP_PATH;
    this.client.on("error", (err) => {
      this.logger.error(`SFTP client error: ${err.message}`);
    });

    this.client.on("end", () => {
      this.logger.debug("SFTP connection ended");
    });

    this.client.on("close", () => {
      this.logger.debug("SFTP connection closed");
    });
  }

  async connect() {
    try {
      const privateKey = Buffer.from(
        process.env.SFTP_PRIVATE_KEY_BASE64,
        "base64",
      ).toString("utf-8");
      await this.client.connect({
        host: process.env.SFTP_HOST,
        port: parseInt(process.env.SFTP_PORT),
        username: process.env.SFTP_USERNAME,
        privateKey,
        readyTimeout: 20000,
      });

      this.logger.debug("Connected to the SFTP server using SSH key");
    } catch (error) {
      this.logger.error(
        `Failed to connect to the SFTP server: ${error.message}`,
      );
      throw error;
    }
  }

  async disconnect() {
    this.client.end();
    this.logger.debug("Disconnected from the SFTP server");
  }

  /**
   * Checks each user folder for files, passing them to validation,
   * and removing them from the sftp server.
   */
  async scanAndProcessFolders() {
    try {
      this.logger.debug(`Trying to list: ${this.remoteBasePath}`);
      const folders = await this.client.list(this.remoteBasePath);

      for (const folder of folders) {
        if (folder.type === "d") {
          const folderPath: string = `${this.remoteBasePath}/${folder.name}`;
          const files = await this.client.list(folderPath);

          for (const file of files) {
            if (file.type === "-") {
              const filePath: string = `${folderPath}/${file.name}`;
              this.logger.debug(`Processing file: ${filePath}`);

              try {
                const sftp_user = await this.prisma.sftp_users.findUnique({
                  where: { username: folder.name },
                });
                if (!sftp_user) {
                  throw new NotFoundException(
                    `User with username ${folder.name} not found in the database.`,
                  );
                }
                this.logger.debug(
                  `Processing ${file.name} for user ${sftp_user.username}`,
                );

                let errors: string[] = [];
                // if the file is > 10MB, don't download it
                if (file.size > 10 * 1024 * 1024) {
                  errors = ["File size exceeds the limit of 10MB."];
                  // don't download the file, just send out a notification of the error
                  const ministryContact = ""; // should be obtained from file somehow
                  await this.notificationsService.notifySftpUserOfError(
                    folder.name,
                    file.name,
                    errors,
                    ministryContact,
                  );
                } else {
                  const fileBuffer = await this.client.get(filePath);
                  const buffer = Buffer.isBuffer(fileBuffer)
                    ? fileBuffer
                    : Buffer.from(fileBuffer);
                  // submit the file
                  // TODO - Uncomment and test SFTP file submission into rest of the app
                  // await this.fileSubmissionsService.createWithSftp(
                  //   {
                  //     userID: ftp_user.username,
                  //     orgGUID: ftp_user.org_guid,
                  //     agency: ftp_user.name,
                  //     operation: "IMPORT",
                  //   },
                  //   {
                  //     fieldname: file.name,
                  //     originalname: file.name,
                  //     encoding: "7bit",
                  //     mimetype: "application/octet-stream",
                  //     buffer: buffer,
                  //     size: buffer.length,
                  //   } as Express.Multer.File,
                  // );

                  // ~~~~~~~~~~~~~~~~~~~~~
                  // TODO - delete this debug email
                  const ministryContact = "";
                  errors = ["Computer says no."];
                  await this.notificationsService.notifySftpUserOfError(
                    folder.name,
                    file.name,
                    errors,
                    ministryContact,
                  );
                  // ~~~~~~~~~~~~~~~~~~~~~
                  console.debug("File Test Successful");
                }
              } catch (error) {
                this.logger.error(
                  "Error during file download or processing",
                  error,
                );
              } finally {
                this.logger.debug(`Cleaning up file: ${filePath}`);
                await this.client.delete(filePath);
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error("Error scanning and processing folders", error);
      throw error;
    }
  }

  @Cron("0 */10 * * * *")
  async handleCron() {
    this.logger.debug("START ################");
    this.logger.debug("######################");
    this.logger.debug("Cron job started");
    try {
      await this.connect();
      await this.scanAndProcessFolders();
    } catch (error) {
      this.logger.error("Error in cron job", error);
    } finally {
      await this.disconnect();
      this.logger.debug("######################");
      this.logger.debug("END ##################");
    }
  }
}
