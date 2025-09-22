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
  BadRequestException
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

  async isMoreThan10000(file: Express.Multer.File): Promise<Boolean>{
    try {
      const mimeType = file.mimetype;

      let rowCount = 0;

      if (mimeType === "text/csv" || file.originalname.endsWith(".csv")){
        const content = file.buffer.toString();
        rowCount = content.split(/\r?\n/).filter(line => line.trim() !== '').length
      }else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')
      ){
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer as any)
        rowCount = workbook.worksheets[0].rowCount;
      }

      if (rowCount <= 10000){
        return false
      }else{
        return true
      }
    }catch (e) {
      console.error('File parsing error:', e);
      return true;
    }
  }

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

    const morethan10k = await this.isMoreThan10000(file);

    if (morethan10k){
      throw new BadRequestException('File has more than 10,000 rows')
    }

    await this.fileSubmissionsService.createWithSftp( 
      {
        userID: apiKeyRecord.username,
        orgGUID: null,
        agency: apiKeyRecord.organization_name,
        operation: "IMPORT",
        data_submitter_email: apiKeyRecord.email_address
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
