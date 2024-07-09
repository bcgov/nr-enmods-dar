import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";

@Injectable()
export class NotificationsService {
  constructor(private readonly httpService: HttpService) {}

  // sends an email formatted with html that has all the report data
  async sendEmail(
    email: string,
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
          to: [`${email}`],
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
      console.log("333 attempting emailmerge");
      const response = await lastValueFrom(this.httpService.request(config));
      console.log(response);
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

  async createNotificationEntry(): Promise<string> {}

  async disableNotifications(): Promise<string> {}

  async enableNotifications(): Promise<string> {}

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
      console.log("~~~~~~~~~~~~");
      console.log("~~~~~~~~~~~~");
      console.log("response.data.access_token");
      console.log(response.data.access_token);
      console.log("~~~~~~~~~~~~");
      console.log("~~~~~~~~~~~~");
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
