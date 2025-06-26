import { ApiProperty } from "@nestjs/swagger";

export class CreateApiKeyDto {
  @ApiProperty()
  username?: string;

  @ApiProperty()
  email_address?: string;

  @ApiProperty()
  organization_name?: string;

  @ApiProperty()
  create_user_id: string;

  @ApiProperty()
  update_user_id: string;
}
