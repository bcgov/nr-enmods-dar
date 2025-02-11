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
  Res,
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
import { OperationLockService } from "src/operationLock/operationLock.service";

@ApiTags("file_submissions")
@Controller({ path: "file_submissions", version: "1" })
@UseGuards(JwtAuthGuard)
@UseGuards(JwtRoleGuard)
@Roles(Role.ENMODS_ADMIN)
export class FileSubmissionsController {
  constructor(
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly sanitizeService: SanitizeService,
    private readonly operationLockService: OperationLockService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10000000 })],
      }),
    )
    file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.fileSubmissionsService.create(body, file);
  }

  @Get()
  findByCode(@Param("submissionCode") submissionCode: string) {
    return this.fileSubmissionsService.findByCode(submissionCode);
  }

  @Post("search")
  @UseInterceptors(FileInterceptor("file"))
  async findByQuery(
    @Body() body: any,
  ): Promise<FileResultsWithCount<FileInfo>> {
    return this.fileSubmissionsService.findBySearch(body);
  }

  @Get(":fileName")
  getFromS3(@Param("fileName") fileName: string) {
    return this.fileSubmissionsService.getFromS3(fileName);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateFileSubmissionDto: UpdateFileSubmissionDto,
  ) {
    return this.fileSubmissionsService.update(+id, updateFileSubmissionDto);
  }

  @Delete(":file_name/:id")
  remove(@Param("file_name") file_name: string, @Param("id") id: string) {
    
    if (!this.operationLockService.acquireLock("DELETE")){
      return
    }

    return this.fileSubmissionsService.remove(file_name, id);
  }
}
