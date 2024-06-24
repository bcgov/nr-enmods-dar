import { IsNotEmpty } from "class-validator";

export class UserRolesDto {
  @IsNotEmpty()
  idirUsername: string;

  @IsNotEmpty()
  roles: string[];
}
