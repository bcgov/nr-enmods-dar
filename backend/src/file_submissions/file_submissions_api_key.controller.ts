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
  BadRequestException,
  HttpException,
  HttpStatus,
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
import ExcelJS from "exceljs";

/**
 * Controller for handling file submissions via API key authentication.
 *
 * This controller provides endpoints for uploading files using an API key.
 * It enforces rate limiting per API key, validates file size and row count,
 * and passes valid files to the fileSubmissionsService for processing.
 */
@ApiTags("file_submissions_api_key")
@Controller({ path: "file_submissions_api_key", version: "1" })
@Public()
export class FileSubmissionsAPIController {
  constructor(
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly sanitizeService: SanitizeService,
    private readonly operationLockService: OperationLockService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Checks if the uploaded file contains more than 10,000 rows.
   * Supports both CSV and XLSX file formats.
   *
   * @param file The uploaded file to check.
   * @returns Promise<boolean> True if the file has more than 10,000 rows, otherwise false.
   */
  async isMoreThan10000(file: Express.Multer.File): Promise<Boolean> {
    try {
      const mimeType = file.mimetype;

      let rowCount = 0;

      if (mimeType === "text/csv" || file.originalname.endsWith(".csv")) {
        const content = file.buffer.toString();
        rowCount = content
          .split(/\r?\n/)
          .filter((line) => line.trim() !== "").length;
      } else if (
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.originalname.endsWith(".xlsx")
      ) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as any);
        rowCount = workbook.worksheets[0].rowCount;
      }

      if (rowCount <= 10000) {
        return false;
      } else {
        return true;
      }
    } catch (e) {
      console.error("File parsing error:", e);
      return true;
    }
  }

  /**
   * Handles file upload requests authenticated by API key.
   * Enforces rate limiting, validates file size and row count,
   * and processes the file if all checks pass.
   *
   * @param file The uploaded file.
   * @param body The request body.
   * @param req The HTTP request object.
   * @throws TooManyRequestsException if rate limit is exceeded.
   * @throws BadRequestException if the file has more than 10,000 rows.
   */
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
    // Get API key from header to use for rate limiting
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

    // Rate limiting logic: N files per M minutes (configurable)
    const now = new Date();
    const windowStart = new Date(now);
    // Get window size in minutes from env, default to 5
    const windowMinutes = parseInt(process.env.API_KEY_RATE_LIMIT_WINDOW_MINUTES || "5", 10);
    const minutes = windowStart.getMinutes();
    windowStart.setMinutes(minutes - (minutes % windowMinutes), 0, 0);

    const usage = await this.prisma.api_key_usage.upsert({
      where: {
        api_key_window_start: {
          api_key: apiKey,
          window_start: windowStart,
        },
      },
      update: {
        request_count: { increment: 1 },
      },
      create: {
        api_key: apiKey,
        window_start: windowStart,
        request_count: 1,
      },
    });

    const MAX_REQUESTS_PER_WINDOW = parseInt(
      process.env.API_KEY_RATE_LIMIT_PER_WINDOW  || "10",
      10,
    );

    if (usage.request_count > MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        `Rate limit exceeded (${MAX_REQUESTS_PER_WINDOW} files per ${windowMinutes} minutes)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const morethan10k = await this.isMoreThan10000(file);

    if (morethan10k) {
      throw new BadRequestException("File has more than 10,000 rows");
    }

    await this.fileSubmissionsService.createWithSftp(
      {
        userID: apiKeyRecord.username,
        orgGUID: null,
        agency: apiKeyRecord.organization_name,
        operation: "IMPORT",
        data_submitter_email: apiKeyRecord.email_address,
        api_submission: true,
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
