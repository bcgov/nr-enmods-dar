import { Injectable, Logger } from "@nestjs/common";
import path from "path";
import * as XLSX from "xlsx";
@Injectable()
export class FtpFileValidationService {
  private readonly logger = new Logger(FtpFileValidationService.name);

  async processFile(fileBuffer: Buffer, filePath: string): Promise<string[]> {
    const errors = [];
    // Required column headers
    const requiredHeaders = ["test1", "test2", "test3"];

    // Check file size is under 10 MB
    if (fileBuffer.length > 10 * 1024 * 1024) {
      errors.push("File size exceeds the limit of 10 MB.");
    }
    // Determine file type using headers
    let fileType = await this.getFileType(fileBuffer);
    // csv and txt are not detected using file headers, use file extension as fallback
    const fileExtension = path.extname(filePath).toLowerCase().replace(".", "");
    if (!fileType) fileType = fileExtension;
    // Check row count and headers
    let headerError: string | null = null;
    switch (fileType) {
      case "csv":
        headerError = await this.validateCsvHeaders(
          fileBuffer,
          requiredHeaders,
        );
        if (headerError) errors.push(headerError);
        break;
      case "xlsx":
        headerError = await this.validateXlsxHeaders(
          fileBuffer,
          requiredHeaders,
        );
        if (headerError) errors.push(headerError);
        break;
      case "txt":
        headerError = await this.validateTxtHeaders(
          fileBuffer,
          requiredHeaders,
        );
        if (headerError) errors.push(headerError);
        break;
      default:
        errors.push("Unsupported file type.");
    }
    return errors;
  }

  private async getFileType(fileBuffer: Buffer): Promise<string> {
    const fileType = await import("file-type");
    const type: any = await fileType.fileTypeFromBuffer(fileBuffer);
    return type?.ext;
  }

  /**
   * CSV file validation: 10k row limit, check headers
   * @param fileBuffer
   * @param requiredHeaders
   * @returns
   */
  private async validateCsvHeaders(
    fileBuffer: Buffer,
    requiredHeaders: string[],
  ): Promise<string | null> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any = XLSX.utils.sheet_to_json(sheet);

      // Get headers
      const headersFound = new Set<string>();
      if (jsonData.length > 0) {
        const headers: string[] = Object.keys(jsonData[0]);
        headers.forEach((header) => headersFound.add(header));
      }

      const missingHeaders = requiredHeaders.filter(
        (header) => !headersFound.has(header),
      );
      if (missingHeaders.length > 0) {
        return `Missing headers in CSV file: ${missingHeaders.join(", ")}`;
      } else {
        return null;
      }
    } catch (error) {
      return `Error processing CSV file: ${error.message}`;
    }
  }

  /**
   * XLSX file validation: 10k row limit, check headers
   * @param fileBuffer
   * @param requiredHeaders
   * @returns
   */
  private async validateXlsxHeaders(
    fileBuffer: Buffer,
    requiredHeaders: string[],
  ): Promise<string> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Get headers
      const headersFound = new Set<string>();

      if (jsonData.length > 0) {
        const headers: string[] = jsonData[0];
        headers.forEach((header) => headersFound.add(header));
      }

      const missingHeaders = requiredHeaders.filter(
        (header) => !headersFound.has(header),
      );
      if (missingHeaders.length > 0) {
        return `Missing headers in XLSX file: ${missingHeaders.join(", ")}`;
      } else {
        return null;
      }
    } catch (error) {
      return `Error processing XLSX file: ${error.message}`;
    }
  }

  /**
   * Text file validation, currently expects tab-separated values
   * Unsure if accepting text files is necessary, might delete or adjust later.
   * @param fileBuffer
   * @param requiredHeaders
   * @returns
   */
  private async validateTxtHeaders(
    fileBuffer: Buffer,
    requiredHeaders: string[],
  ): Promise<string | null> {
    try {
      const fileContent: string = fileBuffer.toString("utf8");
      const lines: string[] = fileContent.split("\n");

      // Assuming values are separated by tabs...
      const headers: string[] = lines[0].split("\t");
      const headersFound = new Set<string>();
      headers.forEach((header) => headersFound.add(header));

      const missingHeaders = requiredHeaders.filter(
        (header) => !headersFound.has(header),
      );
      if (missingHeaders.length > 0) {
        return `Missing headers in TXT file: ${missingHeaders.join(", ")}`;
      }

      return null;
    } catch (error) {
      return `Error processing TXT file: ${error.message}`;
    }
  }
}
