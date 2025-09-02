import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { CreateNotificationEntryDto } from "./dto/create-notification_entry.dto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { UpdateNotificationEntryDto } from "./dto/update-notification_entry.dto";
import { EmailTemplate } from "src/types/types";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
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
  async createNotificationEntry(
    email: string,
    username: string,
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
   * @param username
   * @param enabled
   * @returns
   */
  async updateNotificationEntry(
    email: string,
    username: string,
    enabled: boolean,
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
   * receives guid (notification entry id) and subscribes the user to email notifications
   * @param guid
   * @returns
   */
  async subscribe(guid: string): Promise<string> {
    const notificationDto = new UpdateNotificationEntryDto();
    notificationDto.enabled = true;
    notificationDto.update_user_id = "email_subscribe";
    notificationDto.update_utc_timestamp = new Date();

    const notificationEntryPostData: Prisma.notificationsUpdateInput =
      notificationDto;

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

    const notificationEntryPostData: Prisma.notificationsUpdateInput =
      notificationDto;

    const res = await this.prisma.notifications.update({
      where: { id: guid },
      data: notificationEntryPostData,
    });
    this.logger.log(res);
    return "Successfully Unsubscribed";
  }

  /**
   * Gets user notifications status given their email and username, if there is no entry in the
   * notifications database, this function creates one and sets notifications enabled to true.
   * @param email
   * @param username
   * @returns
   */
  async getNotificationStatus(email: string, username: string): Promise<any> {
    let notificationEntry = await this.prisma.notifications.findUnique({
      where: { email: email },
    });

    if (!notificationEntry) {
      await this.createNotificationEntry(email, username);
      notificationEntry = await this.prisma.notifications.findUnique({
        where: { email: email },
      });
    }

    return notificationEntry;
  }

  /**
   * Sends an email to the data submitter. Does not check if notifications are filtered.
   *
   * @param email
   * @param emailTemplate
   * @param variables
   * @returns
   */
  async sendDataSubmitterNotification(
    email: string,
    variables: {
      file_name: string;
      user_account_name: string;
      location_ids: string[];
      file_status: string;
      errors: string;
      warnings: string;
    },
  ): Promise<String> {
    let body = `
    <p>Status: {{file_status}}</p>
    <p>Files Original Name: {{file_name}}</p>
    <p>Date and Time of Upload: {{sys_time}}</p>
    <p>Locations ID(s): ${variables.location_ids.join(", ")}</p>
    `;
    if (variables.warnings !== "") {
      body += `<p>Warnings: {{warnings}}</p>`;
    }
    if (variables.errors !== "") {
      body += `<p>Errors: {{errors}}</p>`;
    }

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
    },
  ): Promise<String> {
    const notificationInfo = await this.getNotificationStatus(
      email,
      variables.user_account_name,
    );
    // check that notifications are enabled before continuing
    if (notificationInfo.enabled === false) {
      return;
    }
    const unsubscribeLink =
      process.env.WEBAPP_URL + `/unsubscribe/${notificationInfo.id}`;
    let body = `
    <p>Status: {{file_status}}</p>
    <p>Files Original Name: {{file_name}}</p>
    <p>Date and Time of Upload: {{sys_time}}</p>
    <p>Locations ID(s): E123445, E464353, E232524</p>
    `;
    if (variables.warnings !== "") {
      body += `<p>Warnings: {{warnings}}</p>`;
    }
    if (variables.errors !== "") {
      body += `<p>Errors: {{errors}}</p>`;
    }

    body += `<p><a href="${unsubscribeLink}">Unsubscribe</a></p>`;

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
    },
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
      url: `${process.env.CHES_EMAIL_URL}`,
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
        this.logger.log("Response:");
        this.logger.log(error.response.data);
        this.logger.log(error.response.status);
        this.logger.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.logger.log("Request:");
        this.logger.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.log("Error", error.message);
      }
      this.logger.log("Error config:");
      this.logger.log(error.config);
      this.logger.log(error);
    }
  }

  /**
   * Notifies the FTP Data Submitter & Ministry Contact of the file validation errors.
   * @param email
   * @param username
   * @param fileName
   * @param errors
   * @param ministryContact
   */
  async notifyUserOfError(
    email: string,
    username: string,
    fileName: string,
    errors: string[],
    ministryContact: string,
  ) {
    const notificationVars = {
      file_name: fileName,
      user_account_name: username,
      location_ids: [],
      file_status: "REJECTED",
      errors: errors.join(","),
      warnings: "",
    };

    // Notify the Data Submitter
    if (this.isValidEmail(email)) {
      await this.sendDataSubmitterNotification(email, notificationVars);
    }
    // Notify the Ministry Contact (if they have not disabled notifications)
    if (this.isValidEmail(ministryContact)) {
      await this.sendContactNotification(ministryContact, notificationVars);
    }
  }

  /**
   * Notifies the FTP Data Submitter & Ministry Contact of the file validation errors.
   * @param username
   * @param fileName
   * @param errors
   * @param ministryContact
   */
  async notifySftpUserOfError(
    username: string,
    fileName: string,
    errors: string[],
    ministryContact: string,
  ) {
    const sftpUser = await this.prisma.sftp_users.findUnique({
      where: { username: username },
    });
    await this.notifyUserOfError(
      sftpUser.email,
      username,
      fileName,
      errors,
      ministryContact,
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Takes an array of email addresses, filters out the ones
   * with notifications disabled, and returns the remaining ones
   * @param emails
   * @returns
   */
  // async checkNotificationsFilter(emails: string[]): Promise<string[]> {
  //   const existingEmails = await this.prisma.notifications.findMany({
  //     where: {
  //       email: {
  //         in: emails,
  //       },
  //     },
  //     select: {
  //       email: true,
  //       enabled: true,
  //     },
  //   });
  //   const newEmails = emails.filter(
  //     (email) => !existingEmails.some((entry) => entry.email === email)
  //   );
  //   for (const email of newEmails) {
  //     await this.createNotificationEntry(email, "system");
  //   }
  //   const enabledEmails = existingEmails
  //     .filter((entry) => entry.enabled)
  //     .map((entry) => entry.email);
  //   return [...enabledEmails, ...newEmails];
  // }

  /**
   * Gets token for CHES email api
   * @returns
   */
  async getChesToken(): Promise<string> {
    const url = process.env.CHES_TOKEN_URL;
    const encodedToken = Buffer.from(
      `${process.env.CHES_CLIENT_ID}:${process.env.CHES_CLIENT_SECRET}`,
    ).toString("base64");

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + encodedToken,
    };

    const grantTypeParam = new URLSearchParams();
    grantTypeParam.append("grant_type", "client_credentials");

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, grantTypeParam.toString(), { headers }),
      );
      return response.data.access_token;
    } catch (error) {
      if (error.response) {
        this.logger.log(
          "Response:",
          error.response.data,
          error.response.status,
          error.response.headers,
        );
      } else if (error.request) {
        this.logger.log("Request:", error.request);
      } else {
        this.logger.log("Error", error.message);
      }
      this.logger.log("Error config:", error.config);
      this.logger.log(error);
    }
  }

  async requestAccess(data: {
    email: string;
    accountType: string;
    fullname: string;
    username: string;
    edtURL: string
  }): Promise<string> {
    let variables = {
      accountType: data.accountType,
      fullname: data.fullname,
      email: data.email,
      username: data.username,
    };
    let edtURL = data.edtURL.substring(0, data.edtURL.lastIndexOf("/") + 1);
    let body = `
    ${data.accountType} user ${data.fullname} with username ${data.username} and email ${data.email} would like access to EDT.
    <br><br>
    To approve this request go to <a href="${edtURL}admin">${edtURL}admin</a>, 
    to deny this request no action is needed.
`;

    const emailTemplate = {
      from: "enmodshelp@gov.bc.ca",
      subject: `New EDT User Requested ${data.accountType}`,
      body: body,
    };

    const chesToken = await this.getChesToken();

    const emailData = JSON.stringify({
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
          to: ["skutty@salussystems.com"],
        },
      ],
      encoding: "utf-8",
      from: emailTemplate.from,
      priority: "normal",
      subject: emailTemplate.subject,
    });

    const config = {
      method: "post",
      url: `${process.env.CHES_EMAIL_URL}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chesToken}`,
      },
      data: emailData,
    };

    try {
      console.log(config)
      await lastValueFrom(this.httpService.request(config));
      return "Email Sent";
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.log("Response:");
        this.logger.log(error.response.data);
        this.logger.log(error.response.status);
        this.logger.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.logger.log("Request:");
        this.logger.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.log("Error", error.message);
      }
      this.logger.log("Error config:");
      this.logger.log(error.config);
      this.logger.log(error);
    }

    let returnMessage = "";

    return returnMessage;
  }
}
