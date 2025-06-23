import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { FileErrorLogsService } from "./file_error_logs.service";
import { CreateFileErrorLogDto } from "./dto/create-file_error_log.dto";
import { UpdateFileErrorLogDto } from "./dto/update-file_error_log.dto";
import { ApiTags } from "@nestjs/swagger";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";

@ApiTags("file_error_logs")
@Controller({ path: "file_error_logs", version: "1" })
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
@Roles(Role.ENMODS_ADMIN, Role.ENMODS_USER, Role.ENMODS_DELETE)
export class FileErrorLogsController {
  constructor(private readonly fileErrorLogsService: FileErrorLogsService) {}

  @Post()
  create(@Body() createFileErrorLogDto: CreateFileErrorLogDto) {
    return this.fileErrorLogsService.create(createFileErrorLogDto);
  }

  @Get()
  findAll() {
    return this.fileErrorLogsService.findAll();
  }

  @Get(":file_submission_id")
  findOne(@Param("file_submission_id") id: string): Promise<string> {
    return this.fileErrorLogsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateFileErrorLogDto: UpdateFileErrorLogDto,
  ) {
    return this.fileErrorLogsService.update(+id, updateFileErrorLogDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.fileErrorLogsService.remove(+id);
  }
}
