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

  async findOne(file_submission_id: string): Promise<string> {
    const fileLogs = await this.prisma.file_error_logs.findMany({
      where: {
        file_submission_id: file_submission_id,
      },
    });

    const formattedMessage = formulateErrorFile(fileLogs);
    return formattedMessage;
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
  const [date, timeWithZ] = new Date(logs[0].create_utc_timestamp)
    .toISOString()
    .split("T");
  const time = timeWithZ.replace("Z", "");
  let fileOperation = ""

  if (logs[0].file_operation_code === 'VALIDATE'){
    fileOperation = "True";
  }else{
    fileOperation = "False";
  }

  formattedMessages =
    `User's Original File: ${logs[0].original_file_name}\n` +
    `${date} ${time}\n\n` +
    `QA Only: ${fileOperation}\n\n` +
    `The following warnings/errors were found during the validation/import of the data.\n` +
    `The data will need to be corrected and uploaded again for validation/import to ENMODS.\n` +
    `If you have any questions, please contact the ministry contact(s) listed below.\n\n` +
    `-----------------------------------------------------------------------\n` +
    `Ministry Contact: ${logs[0].ministry_contact}\n` +
    `-----------------------------------------------------------------------\n\n`;

  logs[0].error_log.forEach((log) => {
    const rowNum = log.rowNum;

    for (const [key, msg] of Object.entries(log.message)) {
      formattedMessages += `${log.type}: Row ${rowNum}: ${key} - ${msg}\n`;
    }
  });

  if (logs[0].error_log.length >= 1) {
    formattedMessages +=
      "\nData was not updated in ENMODS due to errors found in the submission file. Please correct the data and resubmit.";
  }

  return formattedMessages;
}
