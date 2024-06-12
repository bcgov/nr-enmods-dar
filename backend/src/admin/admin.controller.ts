import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";

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
}
