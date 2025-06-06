import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  Req,
} from "@nestjs/common";
import { FileSubmissionsService } from "./file_submissions.service";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express, Request } from "express";
import { SanitizeService } from "src/sanitize/sanitize.service";
import { OperationLockService } from "src/operationLock/operationLock.service";
import { ApiKeyGuard } from "src/auth/apikey.guard";
import { Public } from "src/auth/decorators/public.decorator";
import { PrismaService } from "nestjs-prisma";

@ApiTags("file_submissions_api_key")
@Controller({ path: "file_submissions_api_key", version: "1" })
@UseGuards(ApiKeyGuard)
@Public()
export class FileSubmissionsAPIController {
  constructor(
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly sanitizeService: SanitizeService,
    private readonly operationLockService: OperationLockService,
    private readonly prisma: PrismaService,
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
    @Req() req: Request,
  ) {
    // Get API key from header
    const apiKey = req.headers["x-api-key"] as string;
    // Fetch API key record from DB
    const apiKeyRecord = await this.prisma.api_keys.findFirst({
      where: {
        api_key: apiKey,
        enabled_ind: true,
        revoked_date: null,
      },
    });

    if (!apiKeyRecord) {
      throw new Error("Invalid API key");
    }

    await this.fileSubmissionsService.createWithSftp(
      {
        userID: apiKeyRecord.username,
        orgGUID: null,
        agency: apiKeyRecord.organization_name,
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
