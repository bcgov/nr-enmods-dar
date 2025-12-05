import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { CreateNotificationEntryDto } from "./dto/create-notification_entry.dto";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { UpdateNotificationEntryDto } from "./dto/update-notification_entry.dto";
import { EmailTemplate } from "src/types/types";
import { FileErrorLogsService } from "src/file_error_logs/file_error_logs.service";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { AdminService } from "src/admin/admin.service";
import { JsonValue } from "@prisma/client/runtime/library";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly fileErrorLogsService: FileErrorLogsService,
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly adminService: AdminService,
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
    enabled: boolean,
  ): Promise<string> {
    const createNotificationDto = new CreateNotificationEntryDto();
    createNotificationDto.email = email;
    createNotificationDto.enabled = enabled;
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
  async getNotificationStatus(
    email: string,
    username: string,
    enabled: boolean,
  ): Promise<any> {
    let notificationEntry = await this.prisma.notifications.findUnique({
      where: { email: email },
    });

    if (!notificationEntry) {
      await this.createNotificationEntry(email, username, enabled);
      notificationEntry = await this.prisma.notifications.findUnique({
        where: { email: email },
      });
    }

    return notificationEntry;
  }

  /**
   * Uses a file submission id to gather information on the completed/rejected submission
   * and sends an email to the data submitter. Does not check if notifications are filtered.
   *
   * @param file_submission_id
   * @returns
   */
  async sendDataSubmitterNotification(
    file_submission_id: string,
  ): Promise<String> {
    const file_submission =
      await this.fileSubmissionsService.findBySubmissionId(file_submission_id);
    const errorLogs =
      await this.fileErrorLogsService.findOne(file_submission_id);

    const strippedErrorLogs = errorLogs.replace(
      /[\s\S]*?Ministry Contact:.*?\n[-]+\n\n/,
      "",
    ); // this only keeping rows that pertain to errors/warnings

    const logsAsLines = strippedErrorLogs.trim().split("\n");
    const hasWarnings = logsAsLines.some((line) => line.startsWith("WARN:"));

    const errorsAsHTML = logsAsLines.join("<br>");
    const fileName = `${file_submission.original_file_name}-error_log.txt`;

    const email = file_submission.data_submitter_email;
    if (!this.isValidEmail(email)) {
      return "Invalid email";
    }
    const { submitter_user_id, submission_status_code, original_file_name } =
      file_submission;

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

    const notificationInfo = await this.getNotificationStatus(
      email,
      submitter_user_id,
      true, // this is setting notifications to enabled by default for submitters
    );

    const unsubscribeLink =
      process.env.WEBAPP_URL + `/unsubscribe/${notificationInfo.id}`;

    let fileOperation = "";

    if (file_submission.file_operation_code === "VALIDATE") {
      fileOperation = "True"; // this means its a validation only file
    } else {
      fileOperation = "False";
    }

    let body = `<p>Status: ${
      hasWarnings &&
      (submission_status_code === "SUBMITTED" ||
        submission_status_code === "VALIDATED")
        ? submission_status_code + " with warnings"
        : submission_status_code
    }</p>
    <p>Files Original Name: ${original_file_name}</p>
    <p>Date and Time of Upload: ${file_submission.submission_date}</p>
    <p>Warnings/Errors:</p>
    `;

    if (file_submission.api_submission_ind === true) {
      body = body
        .concat(errorsAsHTML)
        .concat(
          `<p>Submission Notification</p>`,
        );
    }else{
      body = body
        .concat(errorsAsHTML)
        .concat(
          `<p>Submission Notification</p><p><a href="${unsubscribeLink}">Unsubscribe</a></p>`,
        );
    }

    let emailSubject = "";
    // File upload for validation and status validated without warnings
    if (
      fileOperation === "True" &&
      submission_status_code === "VALIDATED" &&
      !hasWarnings
    ) {
      emailSubject =
        "EnMoDS Data {{submission_status_code}} {{original_file_name}} from {{submitter_user_id}}";
      // File updload for validation and status validated with warnings
    } else if (
      fileOperation === "True" &&
      submission_status_code === "VALIDATED" &&
      hasWarnings
    ) {
      emailSubject =
        "EnMoDS Data {{submission_status_code}} with warnings {{original_file_name}} from {{submitter_user_id}}";
      // File upload for validation and status rejected
    } else if (
      fileOperation === "True" &&
      submission_status_code === "REJECTED"
    ) {
      emailSubject =
        "EnMoDS Data VALIDATION-{{submission_status_code}} {{original_file_name}} from {{submitter_user_id}}";
      // File upload for submission and status submitted without warnings
    } else if (
      fileOperation === "False" &&
      submission_status_code === "SUBMITTED" &&
      !hasWarnings
    ) {
      emailSubject =
        "EnMoDS Data {{submission_status_code}} {{original_file_name}} from {{submitter_user_id}}";
      // File upload for submission and status submitted with warnings
    } else if (
      fileOperation === "False" &&
      submission_status_code === "SUBMITTED" &&
      hasWarnings
    ) {
      emailSubject =
        "EnMoDS Data {{submission_status_code}} with warnings {{original_file_name}} from {{submitter_user_id}}";
      // File upload for submission and status rejected
    } else if (
      fileOperation === "False" &&
      submission_status_code === "REJECTED"
    ) {
      emailSubject =
        "EnMoDS Data {{submission_status_code}} {{original_file_name}} from {{submitter_user_id}}";
    }

    const emailTemplate: EmailTemplate = {
      from: "enmodshelp@gov.bc.ca",
      subject: emailSubject,
      body: body,
    };

    if (notificationInfo.enabled === true) {
      return this.sendEmail([email], emailTemplate, {
        submitter_user_id: submitter_user_id,
        submission_status_code: submission_status_code,
        original_file_name: original_file_name,
        file_error_log: errorLogs,
        file_name: fileName,
        sys_time,
      });
    } else {
      return "";
    }
  }

  async findMinistryEmails(contacts: any) {
    if (contacts[0].ministry_contact === null) {
      return [];
    }
    const contactList = contacts.flatMap((contact) =>
      contact.ministry_contact.flatMap((str) => {
        return str.split(",").map((name) => name.trim());
      }),
    );
    const lowerCaseContactList = new Set(
      contactList.map((contact) => contact.toLowerCase()),
    );

    const allUsers = await this.adminService.findAll();

    const filteredUsers = allUsers.filter(
      (user) =>
        lowerCaseContactList.has(user.name.toLowerCase()) &&
        user.guidUsername.endsWith("idir"),
    );

    const emailsToSend = filteredUsers.map((user) => user.email);
    console.log(emailsToSend);

    return emailsToSend;
  }

  /**
   * Sends an email to the contact(s) specified inside of a submitted file.
   *
   * @param emails
   * @param emailTemplate
   * @param variables
   * @returns
   */
  async sendContactNotification(file_submission_id: string): Promise<String> {
    const file_submission =
      await this.fileSubmissionsService.findBySubmissionId(file_submission_id);

    const { submitter_user_id, submission_status_code, original_file_name } =
      file_submission;

    const errorLogs =
      await this.fileErrorLogsService.findOne(file_submission_id);

    const strippedErrorLogs = errorLogs.replace(
      /[\s\S]*?Ministry Contact:.*?\n[-]+\n\n/,
      "",
    ); // this only keeping rows that pertain to errors/warnings

    const logsAsLines = strippedErrorLogs.trim().split("\n");
    const hasWarnings = logsAsLines.some((line) => line.startsWith("WARN:"));

    const errorsAsHTML = logsAsLines.join("<br>");

    const fileName = `${file_submission.original_file_name}-error_log.txt`;

    const ministryContacts =
      await this.fileErrorLogsService.getMinistryContacts(file_submission_id);

    const contactEmails = await this.findMinistryEmails(ministryContacts);

    for (const email of contactEmails) {
      const notificationInfo = await this.getNotificationStatus(
        email,
        submitter_user_id,
        false, // this is setting notifications to disabled by default for ministry contacts
      );
      const unsubscribeLink =
        process.env.WEBAPP_URL + `/unsubscribe/${notificationInfo.id}`;

      let body = `<p>Status: ${
        hasWarnings &&
        (submission_status_code === "SUBMITTED" ||
          submission_status_code === "VALIDATED")
          ? submission_status_code + " with warnings"
          : submission_status_code
      }</p>
    <p>Files Original Name: ${original_file_name}</p>
    <p>Date and Time of Upload: ${file_submission.submission_date}</p>
    <p>Warnings/Errors:</p>
    `;
      body = body
        .concat(errorsAsHTML)
        .concat(
          `<p>Submission Notification</p><p><a href="${unsubscribeLink}">Unsubscribe</a></p>`,
        );

      const emailTemplate = {
        from: "enmodshelp@gov.bc.ca",
        subject:
          hasWarnings &&
          (submission_status_code === "SUBMITTED" ||
            submission_status_code === "VALIDATED")
            ? "EnMoDS Data {{submission_status_code}} with warnings {{original_file_name}} from {{submitter_user_id}}"
            : "EnMoDS Data {{submission_status_code}} {{original_file_name}} from {{submitter_user_id}}",
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

      if (notificationInfo.enabled === true) {
        return this.sendEmail([email], emailTemplate, {
          submitter_user_id: submitter_user_id,
          submission_status_code: submission_status_code,
          original_file_name: original_file_name,
          file_error_log: errorLogs,
          file_name: fileName,
          sys_time,
        });
      } else {
        return "";
      }
    }
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
      submitter_user_id: string;
      submission_status_code: string;
      original_file_name: string;
      file_error_log: string;
      file_name: string;
      sys_time: string;
    },
  ): Promise<string> {
    const chesToken = await this.getChesToken();
    this.logger.log("sending email");
    // file_error_log is a string, convert it to base64
    const base64ErrorLog = btoa(variables.file_error_log);

    const data = JSON.stringify({
      attachments: [
        {
          content: base64ErrorLog,
          contentType: "string",
          encoding: "base64",
          filename: variables.file_name,
        },
      ],
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
      const response = await lastValueFrom(this.httpService.request(config));
      this.logger.log(`Email sent with status: ${response.status}`);
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
  async notifyUserOfError(file_submission_id: string) {
    // Notify the Data Submitter
    await this.sendDataSubmitterNotification(file_submission_id);
    this.logger.log(`Data submitter notified for submission ID: ${file_submission_id}`);

    // Notify the Ministry Contact (if they have not disabled notifications)
    await this.sendContactNotification(file_submission_id);
    this.logger.log(`Ministry contact(s) notified for submission ID: ${file_submission_id}`);
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
    // const ftpUser = await this.prisma.ftp_users.findUnique({
    //   where: { username: username },
    // });
    // await this.notifyUserOfError(
    //   ftpUser.email,
    //   username,
    //   fileName,
    //   errors,
    //   ministryContact,
    // );
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
    edtURL: string;
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
          to: ["enmodshelp@gov.bc.ca"],
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
      console.log(config);
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
