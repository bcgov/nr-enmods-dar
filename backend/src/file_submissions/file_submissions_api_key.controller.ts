import {
  Controller,
  Post,
  Body,
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
import { OperationLockService } from "src/operationLock/operationLock.service";
import { ApiKeyGuard } from "src/auth/apikey.guard";
import { Public } from "src/auth/decorators/public.decorator";

@ApiTags("file_submissions_api_key")
@Controller({ path: "file_submissions_api_key", version: "1" })
@UseGuards(ApiKeyGuard)
@Public()
export class FileSubmissionsAPIController {
  constructor(
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly sanitizeService: SanitizeService,
    private readonly operationLockService: OperationLockService,
  ) {}

  @Post()
  @Public()
  @UseGuards(ApiKeyGuard)
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
    // submit the file
    await this.fileSubmissionsService.createWithSftp(
      {
        userID: body.username,
        orgGUID: body.org_guid,
        agency: body.name,
        operation: "IMPORT",
      },
      {
        fieldname: file.filename,
        originalname: file.originalname,
        encoding: "7bit",
        mimetype: "application/octet-stream",
        buffer: file.buffer,
        size: file.buffer.length,
      } as Express.Multer.File,
    );
  }
}
