import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";
import { UserRolesDto } from "./dto/user-roles.dto";
import { IdirUserInfo } from "src/types/types";

@Controller("admin")
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
@Roles(Role.ENMODS_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll(): Promise<any[]> {
    return this.adminService.findAll();
  }

  @Post("user-email-search")
  userEmailSearch(@Body() body: { email: string }): Promise<IdirUserInfo> {
    return this.adminService.userEmailSearch(body.email);
  }

  @Post("add-roles")
  addRoles(
    @Body() userRolesDto: UserRolesDto
  ): Promise<{ userObject: IdirUserInfo; error: string }> {
    return this.adminService.addRoles(userRolesDto);
  }

  @Post("remove-roles")
  removeRoles(
    @Body() userRolesDto: UserRolesDto
  ): Promise<{ error: string | null }> {
    return this.adminService.removeRoles(userRolesDto);
  }

  @Post("update-roles")
  updateRoles(
    @Body()
    data: {
      idirUsername: string;
      existingRoles: string[];
      roles: string[];
    }
  ): Promise<{ error: string | null }> {
    return this.adminService.updateRoles(
      data.idirUsername,
      data.existingRoles,
      data.roles
    );
  }
}
