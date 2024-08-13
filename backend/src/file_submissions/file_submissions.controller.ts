import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
} from "@nestjs/common";
import { FileSubmissionsService } from "./file_submissions.service";
import { CreateFileSubmissionDto } from "./dto/create-file_submission.dto";
import { UpdateFileSubmissionDto } from "./dto/update-file_submission.dto";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { Roles } from "src/auth/decorators/roles.decorators";
import { Role } from "src/enum/role.enum";
import { JwtRoleGuard } from "src/auth/jwtrole.guard";
import { JwtAuthGuard } from "src/auth/jwtauth.guard";
import { FileResultsWithCount } from "src/interface/fileResultsWithCount";
import { file_submission } from "@prisma/client";
import { SanitizeService } from "src/sanitize/sanitize.service";
import { FileInfo } from "src/types/types";

@ApiTags("file_submissions")
@Controller({ path: "file_submissions", version: "1" })
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
@Roles(Role.ENMODS_ADMIN)
export class FileSubmissionsController {
  constructor(
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly sanitizeService: SanitizeService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10000000 })],
      })
    )
    file: Express.Multer.File,
    @Body() body: any
  ) {
    return this.fileSubmissionsService.create(body, file);
  }

  @Get()
  findAll() {
    return this.fileSubmissionsService.findAll();
  }

  @Post("search")
  @UseInterceptors(FileInterceptor("file"))
  async findByQuery(
    @Body() body: any
  ): Promise<FileResultsWithCount<FileInfo>> {
    return this.fileSubmissionsService.findBySearch(body);
  }

  @Get(":fileName")
  findOne(
    @Param("fileName") fileName: string
  ): Promise<FileResultsWithCount<file_submission>> {
    const sanitizedParam = this.sanitizeService.sanitizeInput(fileName);
    return this.fileSubmissionsService.findOne(sanitizedParam);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateFileSubmissionDto: UpdateFileSubmissionDto
  ) {
    return this.fileSubmissionsService.update(+id, updateFileSubmissionDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.fileSubmissionsService.remove(+id);
  }
}
