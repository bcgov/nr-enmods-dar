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
    description: "Error log data",
  })
  error_log: string;
}
