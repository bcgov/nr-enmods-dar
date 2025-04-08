import { ApiProperty } from '@nestjs/swagger';

export class FileSubmissionDto {
  @ApiProperty({
    description: 'Submission id for the file',
    // default: '9999',
  })
  submission_id: string;

  @ApiProperty({
    description: 'Name of the file',
  })
  filename: string;

  @ApiProperty({
    description: 'original filename',
  })
  original_filename: string;

  @ApiProperty({
    description: 'Submission date'
  })
  submission_date: Date;

  @ApiProperty({
    description: 'Submitter user id',
    // default: '9999',
  })
  submitter_user_id: string;

  @ApiProperty({
    description: 'Unique identifies for the submitted file',
    // default: '9999',
  })
  submission_status_code: string;

  @ApiProperty({
    description: 'File operation',
  })
  file_operation_code: string;

  @ApiProperty({
    description: 'Submitter agency name',
    // default: '9999',
  })
  submitter_agency_name: string;

  @ApiProperty({
    description: 'Sample count',
    // default: '9999',
  })
  sample_count: number;

  @ApiProperty({
    description: 'Result count',
  })
  result_count: number;

  @ApiProperty({
    description: 'True if active, false otherwise',
    default: true,
  })
  active_ind: boolean

  @ApiProperty({
    description: 'Error Log',
    // default: 'username',
  })
  error_log: string;

  @ApiProperty({
    description: 'Organization GUID',
  })
  organization_guid: string;

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

  @ApiProperty({
    description: 'Number of rows in the file',
  })
  file_row_count: string;
}