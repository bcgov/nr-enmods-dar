import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FileStatusCodesService } from './file_status_codes.service';
import { CreateFileStatusCodeDto } from './dto/create-file_status_code.dto';
import { UpdateFileStatusCodeDto } from './dto/update-file_status_code.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";

@ApiTags('file_status_codes')
@Controller({ path: "file_status_codes", version: "1" })
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
@Roles(Role.ENMODS_ADMIN, Role.ENMODS_USER)
export class FileStatusCodesController {
  constructor(private readonly fileStatusCodesService: FileStatusCodesService) {}

  @Post()
  create(@Body() createFileStatusCodeDto: CreateFileStatusCodeDto) {
    return this.fileStatusCodesService.create(createFileStatusCodeDto);
  }

  @Get()
  findAll() {
    return this.fileStatusCodesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileStatusCodesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileStatusCodeDto: UpdateFileStatusCodeDto) {
    return this.fileStatusCodesService.update(+id, updateFileStatusCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileStatusCodesService.remove(+id);
  }
}
