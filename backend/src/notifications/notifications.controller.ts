import { Body, Controller, Get, Post } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Public } from "src/auth/decorators/public.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // test route TODO: delete this
  @Get("send-email")
  sendEmail() {
    console.log("sendEmail");
    const emails = ["mtennant@salussystems.com", "mike.smash21@gmail.com"]; // list of emails should come from the file
    const variables = {
      file_name: "test_file.csv",
      user_account_name: "MTENNANT",
      file_status: "Failed",
      errors: "Something went wrong.",
      warnings: "",
    };
    return this.notificationsService.sendContactNotification(emails, variables);
  }

  @Post("update-notification")
  updateNotification(@Body() userData: { email: string; username: string; enabled: boolean }) {
    return this.notificationsService.updateNotificationEntry(userData.email, userData.username, userData.enabled);
  }

  @Post("get-notification-status")
  getNotificationStatus(@Body() userData: { email: string; username: string }) {
    return this.notificationsService.getNotificationStatus(userData.email, userData.username);
  }

  @Post("subscribe")
  subscribe(@Body() data: { guid: string }) {
    return this.notificationsService.subscribe(data.guid);
  }

  @Public()
  @Post("unsubscribe")
  unsubscribe(@Body() data: { guid: string }) {
    return this.notificationsService.unsubscribe(data.guid);
  }
}
