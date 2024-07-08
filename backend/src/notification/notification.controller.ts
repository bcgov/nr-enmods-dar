import { Controller, Get } from "@nestjs/common";
import { NotificationService } from "./notification.service";

@Controller("email")
export class NotificationController {
  constructor(private readonly emailService: NotificationService) {}

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
