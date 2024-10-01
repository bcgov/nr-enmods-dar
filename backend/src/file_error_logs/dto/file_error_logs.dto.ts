import { ApiProperty } from "@nestjs/swagger";

export class FileErrorLogDto {
  @ApiProperty({
    description: "File error log ID",
  })
  file_error_log_id: string;

  @ApiProperty({
    description: "File submission ID",
  })
  file_submission_id: string;

  @ApiProperty({
    description: "File name",
  })
  file_name: string;

  @ApiProperty({
    description: "original file name",
  })
  original_file_name: string;

  @ApiProperty({
    description: "Error log data",
  })
  error_log: string;

  @ApiProperty({
    description: 'The operation the file was submitted for',
  })
  file_operation_code: string;

  @ApiProperty({
    description: 'The ministry contact that needs to be notified',
  })
  ministry_contact: string;

  @ApiProperty({
    description: 'When the user created the record',
  })
  create_utc_timestamp: Date;
}
