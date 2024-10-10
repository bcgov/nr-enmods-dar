import { PickType } from "@nestjs/swagger";
import { FileSubmissionDto } from "./file_submission.dto";

export class CreateFileSubmissionDto extends PickType(FileSubmissionDto, [
  'submission_id',
  'filename',
  'original_filename',
  'submission_date',
  'submitter_user_id',
  'submission_status_code',
  'file_operation_code',
  'submitter_agency_name',
  'sample_count',
  'result_count',
  'active_ind',
  'error_log',
  'organization_guid',
  'data_submitter_email',
  'create_user_id',
  'create_utc_timestamp',
  'update_user_id',
  'update_utc_timestamp',

] as const) {}