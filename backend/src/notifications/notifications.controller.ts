import { Controller, Get } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("email")
export class NotificationsController {
  constructor(private readonly emailService: NotificationsService) {}

  // test route
  @Get("send-email")
  sendEmail() {
    console.log("sendEmail");
    const email = "mtennant@salussystems.com";
    const subject = "Test Email Subject";
    const body = "Test Email Body - {{ testVar }}";
    const bodyVariables = { testVar: "Test Variable" };
    const file = null;
    const fileName = null;
    return this.emailService.sendEmail(
      email,
      subject,
      body,
      bodyVariables,
      file,
      fileName
    );
  }
}
