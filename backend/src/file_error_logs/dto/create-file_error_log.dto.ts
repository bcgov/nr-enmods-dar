import { PickType } from "@nestjs/swagger";
import { FileErrorLogDto } from "./file_error_logs.dto";

export class CreateFileErrorLogDto extends PickType(FileErrorLogDto, [
    'file_error_log_id',
    'file_submission_id',
    'file_name',
    'original_file_name',
    'error_log',
    'create_utc_timestamp'
] as const) {}
