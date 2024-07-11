import { Controller, Get } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

// TODO: this controller is unnecessary, notifications service should be used by other modules directly (file_submissions)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // test route TODO: delete this
  @Get("send-email")
  sendEmail() {
    console.log("sendEmail");
    const emails = ["mtennant@salussystems.com", "mike.smash21@gmail.com"]; // list of emails should come from the file
    const file = null;
    const fileName = null;
    return this.notificationsService.sendFileNotification(
      emails,
      file,
      fileName
    );
  }

  // test route TODO: delete this
  @Get("add-notification")
  addNotification() {
    return this.notificationsService.createNotificationEntry(
      "1234567890@testemail.com",
      "MTENNANT"
    );
  }

  // test route TODO: delete this
  @Get("update-notification")
  updateNotification() {
    return this.notificationsService.updateNotificationEntry(
      "mtennant@salussystems.com",
      false,
      "MTENNANT"
    );
  }
}
