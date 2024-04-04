import { SetMetadata } from "@nestjs/common";
import { Role } from "../../enum/role.enum";

/*
    This decorator is used to which user role is allowed to have the JWT claim
    The role is defined in enum.role
    @Roles(Role.ENMODS_USER) will allow users that have the ENMODS_USER role on the JWT claim.
*/


export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);