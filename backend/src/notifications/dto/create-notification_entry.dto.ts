import { PickType } from "@nestjs/swagger";
import { NotificationDto } from "./notification.dto";

export class CreateNotificationEntryDto extends PickType(NotificationDto, [
  "email",
  "enabled",
  "create_user_id",
  "create_utc_timestamp",
  "update_user_id",
  "update_utc_timestamp",
] as const) {}
