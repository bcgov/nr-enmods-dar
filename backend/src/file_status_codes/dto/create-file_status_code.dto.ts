import { PickType } from "@nestjs/swagger";
import { FileStatusCode } from "./file_status_codes.dto";

export class CreateFileStatusCodeDto extends PickType(FileStatusCode, [
  'submission_status_code',
  'description',
  'display_order',
  'active_ind',
  'create_user_id',
  'create_utc_timestamp',
  'update_user_id',
  'update_utc_timestamp',

] as const) {}