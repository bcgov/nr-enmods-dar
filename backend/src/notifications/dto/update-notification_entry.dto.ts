import { PickType } from "@nestjs/swagger";
import { NotificationDto } from "./notification.dto";

export class CreateNotificationEntryDto extends PickType(NotificationDto, [
  "enabled",
  "update_user_id",
  "update_utc_timestamp",
] as const) {}
