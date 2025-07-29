import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";
import { UserRolesDto } from "./dto/user-roles.dto";
import { BCeIDUserInfo, IdirUserInfo } from "src/types/types";

@Controller("admin")
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(Role.ENMODS_USER, Role.ENMODS_ADMIN)
  findAll(): Promise<any[]> {
    return this.adminService.findAll();
  }

  @Get("getStatus")
  @Roles(Role.ENMODS_ADMIN, Role.ENMODS_USER, Role.ENMODS_DELETE)
  getStatus(): Promise<Boolean> {
    return this.adminService.getAqiStatus()
  }

  @Post("user-email-search")
  @Roles(Role.ENMODS_ADMIN)
  userEmailSearch(@Body() body: { email: string }): Promise<IdirUserInfo> {
    return this.adminService.userEmailSearch(body.email);
  }

  @Post("user-bceid-email-search")
  @Roles(Role.ENMODS_ADMIN)
  userGuidSearch(@Body() body: { email: string }): Promise<BCeIDUserInfo> {
    return this.adminService.bceidUserEmailSearch(body.email);
  }

  @Post("add-roles")
  @Roles(Role.ENMODS_ADMIN)
  addRoles(
    @Body() userRolesDto: UserRolesDto,
  ): Promise<{ userObject: IdirUserInfo; error: string }> {
    return this.adminService.addRoles(userRolesDto);
  }

  @Post("remove-roles")
  @Roles(Role.ENMODS_ADMIN)
  removeRoles(
    @Body() userRolesDto: UserRolesDto,
  ): Promise<{ error: string | null }> {
    return this.adminService.removeRoles(userRolesDto);
  }

  @Post("update-roles")
  @Roles(Role.ENMODS_ADMIN)
  updateRoles(
    @Body()
    data: {
      idirUsername: string;
      existingRoles: string[];
      roles: string[];
    },
  ): Promise<any> {
    return this.adminService.updateRoles(
      data.idirUsername,
      data.existingRoles,
      data.roles,
    );
  }
}
