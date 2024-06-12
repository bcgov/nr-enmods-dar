import { ApiProperty } from '@nestjs/swagger';

export class DryrunDto {
  @ApiProperty({
    description: 'Unique identifies for the submitted file',
    // default: '9999',
  })
  submission_status_code: string;

  @ApiProperty({
    description: 'Full name of the code',
    // default: 'username',
  })
  description: string;

  @ApiProperty({
    description: 'Order in which the code appears',
  })
  display_order: number;

  @ApiProperty({
    description: 'True if active, false otherwise',
    default: true,
  })
  active_ind: boolean

  @ApiProperty({
    description: 'The id of the user that created the record',
  })
  create_user_id: string;

  @ApiProperty({
    description: 'When the user created the record',
  })
  create_utc_timestamp: Date;
  
  @ApiProperty({
    description: 'The id of the user that last updated the record',
  })
  update_user_id: string;

  @ApiProperty({
    description: 'When the user last updated the record',
  })
  update_utc_timestamp: Date;
}
