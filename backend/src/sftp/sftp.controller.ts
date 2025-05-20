import { Controller, Get, UseGuards } from "@nestjs/common";
import { SftpService } from "./sftp.service";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";

@Controller("sftp")
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
export class SftpController {
  constructor(private readonly sftpService: SftpService) {}

  @Get()
  @Roles(Role.ENMODS_ADMIN)
  async getSFTPUsers() {
    return this.sftpService.getSFTPUsers();
  }
}
