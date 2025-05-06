import { Injectable, Logger } from "@nestjs/common";
import path from "path";
import * as XLSX from "xlsx";
import {
  mandatoryHeaders,
  conditionallyMandatoryHeaders,
  optionalHeaders,
  conditionallyOptionalHeaders,
} from "src/utils/constants";
import { PrismaService } from "nestjs-prisma";
import { NotificationsService } from "src/notifications/notifications.service";

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);

  constructor(
    private notificationService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  async processFile(
    fileBuffer: Buffer,
    filePath: string,
    username: string,
    filename: string,
  ): Promise<void> {
    const errors: string[] = [];

    // Determine file type using headers
    let fileType = await this.getFileType(fileBuffer);

    // csv and txt are not detected using file headers, use file extension as fallback
    const fileExtension = path.extname(filePath).toLowerCase().replace(".", "");
    if (!fileType) fileType = fileExtension;

    // Check row count and headers
    const checkFileErrors: string[] = await this.checkFileErrors(
      fileType,
      fileBuffer,
    );
    if (checkFileErrors.length > 0)
      checkFileErrors.forEach((err) => errors.push(err));

    if (errors.length > 0) {
      //   const ministryContact = ""; // should be obtained from file somehow
      //   await this.notificationService.notifySftpUserOfError(
      //     username,
      //     filename,
      //     errors,
      //     ministryContact,
      //   );
      this.logger.log(errors);
    } else {
      // continue to file splitting
    }
  }

  private async getFileType(fileBuffer: Buffer): Promise<string> {
    const fileType = await import("file-type");
    const type: any = await fileType.fileTypeFromBuffer(fileBuffer);
    return type?.ext;
  }

  private async checkFileErrors(
    fileType: string,
    fileBuffer: Buffer,
  ): Promise<string[]> {
    switch (fileType) {
      case "csv":
        return this.validateCsv(fileBuffer);
      case "xlsx":
        return this.validateXlsx(fileBuffer);
      case "txt":
        return this.validateTxt(fileBuffer);
      default:
        return ["Unsupported file type."];
    }
  }

  /**
   * XLSX file validation: 10k row limit, check headers
   * @param fileBuffer
   * @param mandatoryHeaders
   * @returns
   */
  private async validateXlsx(fileBuffer: Buffer): Promise<string[]> {
    const errors: string[] = [];
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let jsonData: any = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      // Extract headers and data
      const headers = jsonData[0];
      const adjustedHeaders = headers.map((header: string) =>
        header.toLowerCase().split(" ").join(""),
      );
      const dataRows = jsonData.slice(1);

      // Combine headers with each row
      const result = dataRows.map((row) => {
        let obj = {};
        row.forEach((value, index) => {
          obj[adjustedHeaders[index]] = value;
        });
        return obj;
      });

      // if the file is too large, stop processing here and return the error
      if (result.length > 10000) {
        errors.push("XLSX file exceeds the row limit of 10,000.");
        return errors;
      }

      const fileErrors = await this.validateHeadersAndData(
        result,
        adjustedHeaders,
      );
      if (fileErrors.length > 0) fileErrors.forEach((err) => errors.push(err));

      return errors;
    } catch (error) {
      return [`Error processing XLSX file: ${error.message}`];
    }
  }

  /**
   * CSV file validation: 10k row limit, check headers
   * @param fileBuffer
   * @param mandatoryHeaders
   * @returns
   */
  private async validateCsv(fileBuffer: Buffer): Promise<string[]> {
    // TODO
    const errors: string[] = [];
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let jsonData: any = XLSX.utils.sheet_to_json(sheet);
      // convert the headers to lowercase
      jsonData = jsonData.map((obj: any) => {
        return Object.keys(obj).reduce((acc: any, key: string) => {
          acc[key.toLowerCase()] = obj[key];
          return acc;
        }, {});
      });

      // if the file is too large, stop processing here and return the error
      if (jsonData.length > 10001) {
        errors.push("CSV file exceeds the row limit of 10,000.");
        return errors;
      }

      //   const fileErrors = await this.validateHeadersAndData(jsonData);
      //   if (fileErrors.length > 0) fileErrors.forEach((err) => errors.push(err));

      return errors;
    } catch (error) {
      return [`Error processing CSV file: ${error.message}`];
    }
  }

  /**
   * Text file validation, currently expects tab-separated values
   * Unsure if accepting text files is necessary, might delete or adjust later.
   * @param fileBuffer
   * @returns
   */
  private async validateTxt(fileBuffer: Buffer): Promise<string[]> {
    const errors: string[] = [];
    try {
      const fileContent: string = fileBuffer.toString("utf8");
      const lines: string[] = fileContent.split("\n");

      // if the file is too large, stop processing here and return the error
      if (lines.length > 10001) {
        errors.push("TXT file exceeds the row limit of 10,000.");
        return errors;
      }

      // TODO - txt header validation
      // Assuming values are separated by tabs...
      //   const headers: string[] = lines[0].split("\t");
      //   const headersFound = new Set<string>();
      //   headers.forEach((header) => headersFound.add(header));

      //   const missingHeaders = mandatoryHeaders.filter(
      //     (header) => !headersFound.has(header),
      //   );
      //   if (missingHeaders.length > 0) {
      //     errors.push(
      //       `Missing headers in TXT file: ${missingHeaders.join(", ")}`,
      //     );
      //   }
      return errors;
    } catch (error) {
      return [`Error processing TXT file: ${error.message}`];
    }
  }

  /**
   * using jsonData and headers, checks for mandatory and conditionally mandatory headers
   * @param jsonData - array of data rows: [{header1: 'value1', header2: 'value2'}, {header1: 'value3', header2: 'value4'}]
   * @param headers - array of lowercase headers with spaces removed: ['header1', 'header2']
   * @returns
   */
  private async validateHeadersAndData(
    jsonData: any[],
    headers: string[],
  ): Promise<string[]> {
    const errors: string[] = [];
    const headersFound = new Set<string>(headers);

    const missingHeaders = mandatoryHeaders.filter(
      (header) => !headersFound.has(header.toLowerCase().split(" ").join("")),
    );
    if (missingHeaders.length > 0) {
      errors.push(
        `Missing mandatory headers in XLSX file: ${missingHeaders.join(", ")}`,
      );
    }

    // Check conditionally mandatory headers
    const cmErrors = await this.checkMissingCmHeaders(jsonData, headersFound);
    if (cmErrors) errors.push(cmErrors);

    return errors;
  }

  /**
   * Checks conditionally mandatory headers
   * @param jsonData - array of data rows: [{header1: 'value1', header2: 'value2'}, {header1: 'value3', header2: 'value4'}]
   * @param headersFound - set of headers found in the file
   * @returns
   */
  private async checkMissingCmHeaders(
    jsonData: any[],
    headersFound: Set<string>,
  ): Promise<string | null> {
    const missingCmHeaders = conditionallyMandatoryHeaders.filter(
      (header) => !headersFound.has(header.toLowerCase().split(" ").join("")),
    );
    const missingCmHeadersWithError = [];
    if (missingCmHeaders.length > 0) {
      for (const header of missingCmHeaders) {
        switch (header) {
          case "Depth Unit": // if Depth is filled in
            if (
              headersFound.has("depth") ||
              headersFound.has("depthupper") ||
              headersFound.has("depthlower")
            ) {
              // check jsonData for any data in these columns, if found, add error
              for (const row of jsonData) {
                // check if depth column exists, check if it has data in this row
                if (
                  row.hasOwnProperty("depth") &&
                  row["depth"] !== null &&
                  row["depth"] !== undefined &&
                  row["depth"] !== ""
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
                // check if depth upper column exists, check if it has data in this row
                if (
                  row.hasOwnProperty("depthupper") &&
                  row["depthupper"] !== null &&
                  row["depthupper"] !== undefined &&
                  row["depthupper"] !== ""
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
                // check if depth lower column exists, check if it has data in this row
                if (
                  row.hasOwnProperty("depthlower") &&
                  row["depthlower"] !== null &&
                  row["depthlower"] !== undefined &&
                  row["depthlower"] !== ""
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Result Unit": // if Result Value, Lab: MDL, or Lab: MRL are filled in
            if (
              headersFound.has("resultvalue") ||
              headersFound.has("methoddetectionlimit") ||
              headersFound.has("methodreportinglimit")
            ) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("resultvalue") &&
                  row["resultvalue"] !== null &&
                  row["resultvalue"] !== undefined &&
                  row["resultvalue"] !== ""
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
                if (
                  row.hasOwnProperty("methoddetectionlimit") &&
                  row["methoddetectionlimit"] !== null &&
                  row["methoddetectionlimit"] !== undefined &&
                  row["methoddetectionlimit"] !== ""
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
                if (
                  row.hasOwnProperty("methodreportinglimit") &&
                  row["methodreportinglimit"] !== null &&
                  row["methodreportinglimit"] !== undefined &&
                  row["methodreportinglimit"] !== ""
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Rounded Value": // if source of rounded value = 'PROVIDED BY USER'
            if (headersFound.has("sourceofroundedvalue")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("sourceofroundedvalue") &&
                  row["sourceofroundedvalue"] !== null &&
                  row["sourceofroundedvalue"] !== undefined &&
                  row["sourceofroundedvalue"] === "PROVIDED BY USER"
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Specimen Name": // if data classification = LAB, FIELD_SURVEY, SURROGATE_RESULT
            if (headersFound.has("dataclassification")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("dataclassification") &&
                  row["dataclassification"] !== null &&
                  row["dataclassification"] !== undefined &&
                  (row["dataclassification"] === "LAB" ||
                    row["dataclassification"] === "FIELD_SURVEY" ||
                    row["dataclassification"] === "SURROGATE_RESULT")
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Method Detection Limit": // if data classification = LAB, FIELD_RESULT, SURROGATE_RESULT
            if (headersFound.has("dataclassification")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("dataclassification") &&
                  row["dataclassification"] !== null &&
                  row["dataclassification"] !== undefined &&
                  (row["dataclassification"] === "LAB" ||
                    row["dataclassification"] === "FIELD_RESULT" ||
                    row["dataclassification"] === "SURROGATE_RESULT")
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Method Reporting Limit": // if data classification = LAB, FIELD_RESULT, SURROGATE_RESULT
            if (headersFound.has("dataclassification")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("dataclassification") &&
                  row["dataclassification"] !== null &&
                  row["dataclassification"] !== undefined &&
                  (row["dataclassification"] === "LAB" ||
                    row["dataclassification"] === "FIELD_RESULT" ||
                    row["dataclassification"] === "SURROGATE_RESULT")
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Lab Arrival Date and Time": // if data classification = LAB, SURROGATE_RESULT
            if (headersFound.has("dataclassification")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("dataclassification") &&
                  row["dataclassification"] !== null &&
                  row["dataclassification"] !== undefined &&
                  (row["dataclassification"] === "LAB" ||
                    row["dataclassification"] === "SURROGATE_RESULT")
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "Fraction": // if data classification = LAB, SURROGATE_RESULT
            if (headersFound.has("dataclassification")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("dataclassification") &&
                  row["dataclassification"] !== null &&
                  row["dataclassification"] !== undefined &&
                  (row["dataclassification"] === "LAB" ||
                    row["dataclassification"] === "SURROGATE_RESULT")
                ) {
                  missingCmHeadersWithError.push(header);
                  break;
                }
              }
            }
            break;
          case "From Laboratory": // if data classification = LAB, SURROGATE_RESULT
            if (headersFound.has("dataclassification")) {
              for (const row of jsonData) {
                if (
                  row.hasOwnProperty("dataclassification") &&
                  row["dataclassification"] !== null &&
                  row["dataclassification"] !== undefined &&
                  (row["dataclassification"] === "LAB" ||
                    row["dataclassification"] === "SURROGATE_RESULT")
                ) {
                  break;
                }
              }
            }
            break;
          case "QC Source Sample ID": // if QC Type not blank use activity name(???)
            // TODO: Need to confirm this logic
            break;
        }
      }
    }
    const missingCmHeaderErrors =
      missingCmHeadersWithError.length > 0
        ? `Missing conditionally mandatory headers: ${missingCmHeadersWithError.join(", ")}`
        : null;
    return missingCmHeaderErrors;
  }
}
