import { PickType } from "@nestjs/swagger";
import { DryrunDto } from "./dryrun.dto";

export class CreateDryrunDto extends PickType(DryrunDto, [
  'submission_status_code',
  'description',
  'display_order',
  'active_ind',
  'create_user_id',
  'create_utc_timestamp',
  'update_user_id',
  'update_utc_timestamp',
] as const) {}