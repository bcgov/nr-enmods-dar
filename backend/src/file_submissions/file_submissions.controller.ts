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
} from "@nestjs/common";
import { FileSubmissionsService } from "./file_submissions.service";
import { CreateFileSubmissionDto } from "./dto/create-file_submission.dto";
import { UpdateFileSubmissionDto } from "./dto/update-file_submission.dto";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";

@ApiTags("file_submissions")
@Controller({ path: "file_submissions", version: "1" })
export class FileSubmissionsController {
  constructor(
    private readonly fileSubmissionsService: FileSubmissionsService
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
    return this.fileSubmissionsService.create(body, file)
  }

  @Get()
  findAll() {
    return this.fileSubmissionsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.fileSubmissionsService.findOne(+id);
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
