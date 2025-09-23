import { Injectable } from "@nestjs/common";
import { CreateFileErrorLogDto } from "./dto/create-file_error_log.dto";
import { UpdateFileErrorLogDto } from "./dto/update-file_error_log.dto";
import { PrismaService } from "nestjs-prisma";
import { JsonValue } from "@prisma/client/runtime/library";

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
      orderBy: {
        create_utc_timestamp: "desc",
      }
    });

    const formattedMessage = formulateErrorFile(fileLogs);
    return formattedMessage;
  }

  async getMinistryContacts(file_submission_id: string): Promise<JsonValue[]>{
    const contacts = await this.prisma.file_error_logs.findMany({
      where: {
        file_submission_id: file_submission_id
      }, 
      select: {
        ministry_contact: true
      },
      orderBy: {
        create_utc_timestamp: "desc"
      }
    })

    return contacts
  }

  update(id: number, updateFileErrorLogDto: UpdateFileErrorLogDto) {
    return `This action updates a #${id} fileErrorLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileErrorLog`;
  }
}

function formulateErrorFile(logs: any) {
  if (logs[0].error_log.length > 0){
    // check if any has ERROR
    const hasError = logs[0].error_log.some(log => log.type === 'ERROR');
    let formattedMessages = "";
    const [date, timeWithZ] = new Date(logs[0].create_utc_timestamp)
      .toISOString()
      .split("T");
    const time = timeWithZ.replace("Z", "");
    let fileOperation = ""
    let fileAction = ""

    if (logs[0].file_operation_code === 'VALIDATE'){
      fileOperation = "True";
      fileAction = "validated"
    }else{
      fileOperation = "False";
      fileAction = "imported"
    }

    let submessage = hasError ? 
    `The following warnings/errors were found during the ${fileOperation ? "validation" : "import"} of the data.\n` + 
    `The data will need to be corrected and uploaded again for ${fileOperation ? "validation" : "import"} to ENMODS.\n` 
    : `Data has successfully been ${fileAction} into EnMoDS with the following warnings.\n`

    formattedMessages =
      `User's Original File: ${logs[0].original_file_name}\n` +
      `${date} ${time}\n\n` +
      `QA Only: ${fileOperation}\n\n` +
      submessage +
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

    const strippedErrorLogs = formattedMessages.replace(
      /[\s\S]*?Ministry Contact:.*?\n[-]+\n\n/,
      "",
    ); // this only keeping rows that pertain to errors/warnings
    const logsAsLines = strippedErrorLogs.trim().split("\n");
    const hasErrors = logsAsLines.some((line) => line.startsWith("ERROR:"));
    const hasWarnings = logsAsLines.some((line) => line.startsWith("WARN:"));

    if (logs[0].error_log.length >= 1 && hasErrors) {
      formattedMessages +=
        "\nData was not updated in ENMODS due to errors found in the submission file. Please correct the data and resubmit.";
    }

    return formattedMessages;
  }else{
    const [date, timeWithZ] = new Date(logs[0].create_utc_timestamp)
      .toISOString()
      .split("T");
    const time = timeWithZ.replace("Z", "");
    let formattedMessages = "";
    let fileOperation = ""
    let fileAction = ""

    if (logs[0].file_operation_code === 'VALIDATE'){
      fileOperation = "True";
      fileAction = "validated";
    }else{
      fileOperation = "False";
      fileAction = "imported";
    }
    formattedMessages =
      `User's Original File: ${logs[0].original_file_name}\n` +
      `${date} ${time}\n\n` +
      `QA Only: ${fileOperation}\n\n` +
      `Data has been successfully ${fileAction} in EnMoDS.\n` +
      `If you have any questions, please contact the ministry contact(s) listed below.\n\n` +
      `-----------------------------------------------------------------------\n` +
      `Ministry Contact: ${logs[0].ministry_contact}\n` +
      `-----------------------------------------------------------------------\n\n` +
      `No errors were found during the validation/import of the data.\n\n` +
      `The file was successfully ${fileAction}.\n\n`;
    
    return formattedMessages;
  }
}
