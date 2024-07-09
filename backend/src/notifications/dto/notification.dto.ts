import { ApiProperty } from "@nestjs/swagger";

export class NotificationDto {
  @ApiProperty({
    description: "Email address",
  })
  email: string;

  @ApiProperty({
    description: "Notifications enabled",
  })
  enabled: boolean;

  @ApiProperty({
    description: "The id of the user that created the record",
  })
  create_user_id: string;

  @ApiProperty({
    description: "When the user created the record",
  })
  create_utc_timestamp: Date;

  @ApiProperty({
    description: "The id of the user that last updated the record",
  })
  update_user_id: string;

  @ApiProperty({
    description: "When the user last updated the record",
  })
  update_utc_timestamp: Date;
}
