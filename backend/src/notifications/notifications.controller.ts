import { validate as uuidValidate } from "uuid";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Public } from "src/auth/decorators/public.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotificationData() {
    return this.notificationsService.getNotificationData();
  }

  // test route TODO: delete this
  @Get("send-email/:email")
  sendEmail(@Param("email") email: string) {
    // const re =
    //   /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // if (!re.test(String(email).toLowerCase())) {
    //   email = "mtennant@salussystems.com";
    // }

    // const variables = {
    //   file_name: "test_file.csv",
    //   user_account_name: "MTENNANT",
    //   file_status: "Failed",
    //   errors: ["Something went wrong."],
    //   warnings: [],
    // };
    // return this.notificationsService.sendContactNotification(email, variables);
  }

  @Post("update-notification")
  updateNotification(
    @Body() userData: { email: string; username: string; enabled: boolean },
  ) {
    return this.notificationsService.updateNotificationEntry(
      userData.email,
      userData.username,
      userData.enabled,
    );
  }

  @Post("get-notification-status")
  getNotificationStatus(@Body() userData: { email: string; username: string }) {
    return this.notificationsService.getNotificationStatus(
      userData.email,
      userData.username,
      true
    );
  }

  @Post("subscribe")
  subscribe(@Body() data: { guid: string }) {
    return this.notificationsService.subscribe(data.guid);
  }

  @Public()
  @Post("unsubscribe")
  unsubscribe(@Body() data: { guid: string }) {
    if (!uuidValidate(data.guid)) {
      throw new BadRequestException("Invalid UUID");
    }
    return this.notificationsService.unsubscribe(data.guid);
  }
}
