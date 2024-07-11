import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { CreateNotificationEntryDto } from "./dto/create-notification_entry.dto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { UpdateNotificationEntryDto } from "./dto/update-notification_entry.dto";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService
  ) {}

  /**
   * Receives email and username. Creates a notification entry with specified email and enabled status as true.
   * @param email
   * @param username
   * @returns
   */
  async createNotificationEntry(
    email: string,
    username: string
  ): Promise<string> {
    const createNotificationDto = new CreateNotificationEntryDto();
    createNotificationDto.email = email;
    createNotificationDto.enabled = true;
    createNotificationDto.create_user_id = username;
    createNotificationDto.create_utc_timestamp = new Date();
    createNotificationDto.update_user_id = username;
    createNotificationDto.update_utc_timestamp = new Date();

    const newNotificationEntryPostData: Prisma.notificationsCreateInput =
      createNotificationDto;

    await this.prisma.$transaction([
      this.prisma.notifications.create({ data: newNotificationEntryPostData }),
    ]);

    return "Notification Entry Created";
  }

  /**
   * Receives email, enabled, and username. Updates the notification entry with specified email
   * to be either enabled or disabled.
   * @param email
   * @param enabled
   * @param username
   * @returns
   */
  async updateNotificationEntry(
    email: string,
    enabled: boolean,
    username: string
  ): Promise<string> {
    const updateNotificationDto = new UpdateNotificationEntryDto();
    updateNotificationDto.enabled = enabled;
    updateNotificationDto.update_user_id = username;
    updateNotificationDto.update_utc_timestamp = new Date();

    const updateNotificationEntryPostData: Prisma.notificationsUpdateInput =
      updateNotificationDto;

    await this.prisma.notifications.update({
      where: { email: email },
      data: updateNotificationEntryPostData,
    });
    return "Notification Entry Updated";
  }

  /**
   * Defines subject & body and then calls sendEmail function
   * @param emails
   * @param file
   * @param fileName
   * @returns
   */
  async sendFileNotification(
    emails: string[],
    file: string,
    fileName: string
  ): Promise<string> {
    const subject = "File Notification Subject";
    const body = "File Notification Body - {{ todaysDate }}";
    const bodyVariables = { todaysDate: `${new Date()}` };
    emails = await this.checkNotificationsFilter(emails);
    return this.sendEmail(emails, subject, body, bodyVariables, file, fileName);
  }

  /**
   * Sends an email to 1 or more recipients with specified subject and body and optional file attachment
   * @param email
   * @param subject
   * @param body
   * @param bodyVariables
   * @param file
   * @param fileName
   * @returns
   */
  async sendEmail(
    emails: string[],
    subject: string,
    body: string,
    bodyVariables: object,
    file: string,
    fileName: string
  ): Promise<string> {
    const chesToken = await this.getChesToken();

    let attachments = [];
    if (file && fileName) {
      attachments = [
        {
          content: file,
          encoding: "hex",
          fileName: fileName,
        },
      ];
    }

    const data = JSON.stringify({
      attachments: attachments,
      bodyType: "html",
      body: body,
      contexts: [
        {
          context: {
            ...bodyVariables,
          },
          delayTS: 0,
          tag: "tag",
          to: emails,
        },
      ],
      encoding: "utf-8",
      from: "enmods-test@gov.bc.ca",
      priority: "normal",
      subject: subject,
    });

    const config = {
      method: "post",
      url: `${process.env.ches_email_url}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chesToken}`,
      },
      data: data,
    };

    try {
      await lastValueFrom(this.httpService.request(config));
      return "Email Sent";
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Response:");
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log("Request:");
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
      console.log("Error config:");
      console.log(error.config);
      console.log(error);
    }
  }

  /**
   * Takes an array of email addresses, filters out the ones
   * with notifications disabled, and returns the remaining ones
   * @param emails
   * @returns
   */
  async checkNotificationsFilter(emails: string[]): Promise<string[]> {
    const existingEmails = await this.prisma.notifications.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
        enabled: true,
      },
    });
    const newEmails = emails.filter(
      (email) => !existingEmails.some((entry) => entry.email === email)
    );
    for (const email of newEmails) {
      await this.createNotificationEntry(email, "system");
    }
    const enabledEmails = existingEmails
      .filter((entry) => entry.enabled)
      .map((entry) => entry.email);
    return [...enabledEmails, ...newEmails];
  }

  /**
   * Gets token for CHES email api
   * @returns
   */
  async getChesToken(): Promise<string> {
    const url = process.env.ches_token_url;
    const encodedToken = Buffer.from(
      `${process.env.ches_client_id}:${process.env.ches_client_secret}`
    ).toString("base64");

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + encodedToken,
    };

    const grantTypeParam = new URLSearchParams();
    grantTypeParam.append("grant_type", "client_credentials");

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, grantTypeParam.toString(), { headers })
      );
      return response.data.access_token;
    } catch (error) {
      if (error.response) {
        console.log(
          "Response:",
          error.response.data,
          error.response.status,
          error.response.headers
        );
      } else if (error.request) {
        console.log("Request:", error.request);
      } else {
        console.log("Error", error.message);
      }
      console.log("Error config:", error.config);
      console.log(error);
    }
  }
}
