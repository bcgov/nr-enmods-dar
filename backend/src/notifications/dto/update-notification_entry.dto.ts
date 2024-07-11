import { PickType } from "@nestjs/swagger";
import { NotificationDto } from "./notification.dto";

export class UpdateNotificationEntryDto extends PickType(NotificationDto, [
  "enabled",
  "update_user_id",
  "update_utc_timestamp",
] as const) {}
