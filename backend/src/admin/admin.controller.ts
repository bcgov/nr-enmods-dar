import { Controller, Get } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll(): Promise<any[]> {
    return this.adminService.findAll();
  }
}
