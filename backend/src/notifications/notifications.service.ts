import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { CreateNotificationEntryDto } from "./dto/create-notification_entry.dto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { UpdateNotificationEntryDto } from "./dto/update-notification_entry.dto";
import { EmailTemplate } from "src/types/types";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService
  ) {}

  /**
   *
   * @returns Notification table
   */
  async getNotificationData(): Promise<any> {
    return this.prisma.notifications.findMany({});
  }

  /**
   * Receives email and username. Creates a notification entry with specified email and enabled status as true.
   * @param email
   * @param username
   * @returns
   */
  async createNotificationEntry(email: string, username: string): Promise<string> {
    const createNotificationDto = new CreateNotificationEntryDto();
    createNotificationDto.email = email;
    createNotificationDto.enabled = true;
    createNotificationDto.create_user_id = username;
    createNotificationDto.create_utc_timestamp = new Date();
    createNotificationDto.update_user_id = username;
    createNotificationDto.update_utc_timestamp = new Date();

    const newNotificationEntryPostData: Prisma.notificationsCreateInput = createNotificationDto;

    await this.prisma.$transaction([this.prisma.notifications.create({ data: newNotificationEntryPostData })]);

    return "Notification Entry Created";
  }

  /**
   * Receives email, enabled, and username. Updates the notification entry with specified email
   * to be either enabled or disabled.
   * @param email
   * @param username
   * @param enabled
   * @returns
   */
  async updateNotificationEntry(email: string, username: string, enabled: boolean): Promise<string> {
    const updateNotificationDto = new UpdateNotificationEntryDto();
    updateNotificationDto.enabled = enabled;
    updateNotificationDto.update_user_id = username;
    updateNotificationDto.update_utc_timestamp = new Date();

    const updateNotificationEntryPostData: Prisma.notificationsUpdateInput = updateNotificationDto;

    await this.prisma.notifications.update({
      where: { email: email },
      data: updateNotificationEntryPostData,
    });
    console.log("notification status set to " + enabled);
    return "Notification Entry Updated";
  }

  /**
   * receives guid (notification entry id) and subscribes the user to email notifications
   * @param guid
   * @returns
   */
  async subscribe(guid: string): Promise<string> {
    const notificationDto = new UpdateNotificationEntryDto();
    notificationDto.enabled = true;
    notificationDto.update_user_id = "email_subscribe";
    notificationDto.update_utc_timestamp = new Date();

    const notificationEntryPostData: Prisma.notificationsUpdateInput = notificationDto;

    await this.prisma.notifications.update({
      where: { id: guid },
      data: notificationEntryPostData,
    });
    return "Successfully Subscribed";
  }

  /**
   * receives guid (notification entry id) and unsubscribes the user to email notifications
   * @param guid
   * @returns
   */
  async unsubscribe(guid: string): Promise<string> {
    const notificationDto = new UpdateNotificationEntryDto();
    notificationDto.enabled = false;
    notificationDto.update_user_id = "email_unsubscribe";
    notificationDto.update_utc_timestamp = new Date();

    const notificationEntryPostData: Prisma.notificationsUpdateInput = notificationDto;

    const res = await this.prisma.notifications.update({
      where: { id: guid },
      data: notificationEntryPostData,
    });
    console.log(res);
    return "Successfully Unsubscribed";
  }

  /**
   * Gets user notifications status given their email and username, if there is no entry in the
   * notifications database, this function creates one and sets notifications enabled to true.
   * @param email
   * @param username
   * @returns
   */
  async getNotificationStatus(email: string, username: string): Promise<boolean> {
    let notificationEntry = await this.prisma.notifications.findUnique({
      where: { email: email },
    });

    if (!notificationEntry) {
      await this.createNotificationEntry(email, username);
      notificationEntry = await this.prisma.notifications.findUnique({
        where: { email: email },
      });
    }

    console.log("Notification Entry:", notificationEntry);
    return notificationEntry.enabled;
  }

  /**
   * Sends an email to the data submitter.
   *
   * @param email
   * @param emailTemplate
   * @param variables
   * @returns
   */
  async sendDataSubmitterNotification(
    email: string,
    emailTemplate: EmailTemplate,
    variables: {
      file_name: string;
      user_account_name: string;
      file_status: string;
      errors: string;
      warnings: string;
    }
  ): Promise<String> {
    let body = "Status: {{file_status}}\n\nFiles Original Name: {{file_name}}\n\nDate and Time of Upload: {{sys_time}}";
    if (variables.warnings !== "") {
      body += "\n\nWarnings: {{warnings}}";
    }
    if (variables.errors !== "") {
      body += "\n\nErrors: {{errors}}";
    }
    // store this somewhere else instead of hardcoding it here (?)
    emailTemplate = {
      from: "enmodshelp@gov.bc.ca",
      subject: "EnMoDS Data {{status_string}} from {{user_account_name}}",
      body: body,
    };
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    const sys_time = date.toLocaleString("en-US", options);
    let status_string = "Imported";
    if (variables.errors !== "") {
      status_string = "Failed";
    } else if (variables.warnings !== "") {
      status_string = "Imported with Warnings";
    }
    return this.sendEmail([email], emailTemplate, {
      ...variables,
      sys_time,
      status_string,
    });
  }

  /**
   * Sends an email to the contact(s) specified inside of a submitted file.
   *
   * @param emails
   * @param emailTemplate
   * @param variables
   * @returns
   */
  async sendContactNotification(
    email: string,
    variables: {
      file_name: string;
      user_account_name: string;
      file_status: string;
      warnings: string;
      errors: string;
    }
  ): Promise<String> {
    const notificationInfo = await this.prisma.notifications.findUnique({ where: { email: email } });
    const unsubscribeLink = process.env.WEBAPP_URL + `/unsubscribe/${notificationInfo.id}`;
    let body =
      "Status: {{file_status}}\n\nFiles Original Name: {{file_name}}\n\nDate and Time of Upload: {{sys_time}}\n\nLocations ID(s): E123445. E464353, E232524";
    if (variables.warnings !== "") {
      body += "\n\nWarnings: {{warnings}}";
    }
    if (variables.errors !== "") {
      body += "\n\nErrors: {{errors}}";
    }
    body += `\n\n<a href="${unsubscribeLink}">Unsubscribe</a>`;
    // store this somewhere else instead of hardcoding it here (?)
    const emailTemplate = {
      from: "enmodshelp@gov.bc.ca",
      subject: "EnMoDS Data {{status_string}} from {{user_account_name}}",
      body: body,
    };
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    const sys_time = date.toLocaleString("en-US", options);
    let status_string = "Imported";
    if (variables.errors !== "") {
      status_string = "Failed";
    } else if (variables.warnings !== "") {
      status_string = "Imported with Warnings";
    }
    return this.sendEmail([email], emailTemplate, {
      ...variables,
      sys_time,
      status_string,
    });
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
    emailTemplate: EmailTemplate,
    variables: {
      file_name: string;
      user_account_name: string;
      file_status: string;
      errors: string;
      warnings: string;
      sys_time: string;
      status_string: string;
    }
  ): Promise<string> {
    const chesToken = await this.getChesToken();

    const data = JSON.stringify({
      attachments: [],
      bodyType: "html",
      body: emailTemplate.body,
      contexts: [
        {
          context: {
            ...variables,
          },
          delayTS: 0,
          tag: "tag",
          to: emails,
        },
      ],
      encoding: "utf-8",
      from: emailTemplate.from,
      priority: "normal",
      subject: emailTemplate.subject,
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
    const newEmails = emails.filter((email) => !existingEmails.some((entry) => entry.email === email));
    for (const email of newEmails) {
      await this.createNotificationEntry(email, "system");
    }
    const enabledEmails = existingEmails.filter((entry) => entry.enabled).map((entry) => entry.email);
    return [...enabledEmails, ...newEmails];
  }

  /**
   * Gets token for CHES email api
   * @returns
   */
  async getChesToken(): Promise<string> {
    const url = process.env.ches_token_url;
    const encodedToken = Buffer.from(`${process.env.ches_client_id}:${process.env.ches_client_secret}`).toString(
      "base64"
    );

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + encodedToken,
    };

    const grantTypeParam = new URLSearchParams();
    grantTypeParam.append("grant_type", "client_credentials");

    try {
      const response = await lastValueFrom(this.httpService.post(url, grantTypeParam.toString(), { headers }));
      return response.data.access_token;
    } catch (error) {
      if (error.response) {
        console.log("Response:", error.response.data, error.response.status, error.response.headers);
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
