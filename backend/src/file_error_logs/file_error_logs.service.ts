import { Injectable } from "@nestjs/common";
import { CreateFileErrorLogDto } from "./dto/create-file_error_log.dto";
import { UpdateFileErrorLogDto } from "./dto/update-file_error_log.dto";
import { PrismaService } from "nestjs-prisma";

@Injectable()
export class FileErrorLogsService {
  constructor(private prisma: PrismaService) {}

  create(createFileErrorLogDto: CreateFileErrorLogDto) {
    return "This action adds a new fileErrorLog";
  }

  findAll() {
    return `This action returns all fileErrorLogs`;
  }

  async findOne(file_submission_id: string) {
    const fileLogs = await this.prisma.file_error_logs.findMany({
      where: {
        file_submission_id: file_submission_id,
      },
      select: {
        error_log: true,
      },
    });

    formulateErrorFile(fileLogs[0].error_log);
  }

  update(id: number, updateFileErrorLogDto: UpdateFileErrorLogDto) {
    return `This action updates a #${id} fileErrorLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileErrorLog`;
  }
}

function formulateErrorFile(logs: any) {
  let formattedMessages = "";

  logs.forEach((log) => {
    const rowNum = log.rowNum;

    for (const [key, msg] of Object.entries(log.message)) {
      formattedMessages += `Row ${rowNum}: ${key} - ${msg}\n`;
    }
  });

  console.log(formattedMessages);
}
