import { ApiProperty } from "@nestjs/swagger";

export class UpdateApiKeyDto {
  @ApiProperty()
  username?: string;

  @ApiProperty()
  email_address?: string;

  @ApiProperty()
  organization_name?: string;

  @ApiProperty()
  revoked_date?: Date;

  @ApiProperty()
  revoked_by?: string;

  @ApiProperty()
  enabled_ind?: boolean;

  @ApiProperty()
  update_user_id: string;

  @ApiProperty()
  update_utc_timestamp: Date;
}
