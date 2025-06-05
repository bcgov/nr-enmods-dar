import { Injectable, Logger } from "@nestjs/common";
import { CreateFileSubmissionDto } from "./dto/create-file_submission.dto";
import { UpdateFileSubmissionDto } from "./dto/update-file_submission.dto";
import { PrismaService } from "nestjs-prisma";
import { FileResultsWithCount } from "src/interface/fileResultsWithCount";
import { Prisma } from "@prisma/client";
import { FileInfo } from "src/types/types";
import * as crypto from "crypto";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { OperationLockService } from "src/operationLock/operationLock.service";
import { equals } from "class-validator";

@Injectable()
export class FileSubmissionsService {
  private readonly logger = new Logger(FileSubmissionsService.name);
  constructor(
    private prisma: PrismaService,
    private readonly objectStore: ObjectStoreService,
    private readonly aqiService: AqiApiService,
    private readonly operationLockService: OperationLockService,
  ) {}

  async create(body: any, file: Express.Multer.File) {
    const createFileSubmissionDto = new CreateFileSubmissionDto();
    console.log(body)

    /*
      TODO:
      - Create a record in the S3 bucket for this file, use the newly created file GUID when inserting the file to the db and for future reference
      - Create a new record in the file_submissions table with the submission_status_code set to INPROGRESS and the file_submission_id as the GUID from the S3 bucket
      - Begin the validation process
        - Do the location validation: if pass continue to AQI API validation, if fail then update file_submissions_status_code to REJECTED and return
        - Do the AQI API validation: if pass continue to set file_submission_status_code to VALIDATED and return, if fail then update file_submissions_status_code to REJECTED and return
    */

    // Call to function that makes API call to save file in the S3 bucket via COMS
    let [comsSubmissionID, newFileName] = await saveToS3(body.token, file);

    // Creating file DTO and inserting it in the database with the file GUID from the S3 bucket
    createFileSubmissionDto.submission_id = comsSubmissionID;
    createFileSubmissionDto.filename = newFileName;
    createFileSubmissionDto.original_filename = file.originalname;
    createFileSubmissionDto.submission_date = new Date();
    createFileSubmissionDto.submitter_user_id = body.userID;
    createFileSubmissionDto.submission_status_code = (
      await this.prisma.submission_status_code.findUnique({
        where: { submission_status_code: "QUEUED" },
      })
    ).submission_status_code;
    createFileSubmissionDto.file_operation_code = body.operation;
    createFileSubmissionDto.submitter_agency_name = body.agency;
    createFileSubmissionDto.sample_count = 0;
    createFileSubmissionDto.result_count = 0;
    // createFileSubmissionDto.file_row_count = body.file_row_count
    createFileSubmissionDto.organization_guid =
      body.orgGUID === "null" ? null : body.orgGUID;
    createFileSubmissionDto.create_user_id = body.userID;
    createFileSubmissionDto.create_utc_timestamp = new Date();
    createFileSubmissionDto.update_user_id = body.userID;
    createFileSubmissionDto.update_utc_timestamp = new Date();

    const newFilePostData: Prisma.file_submissionCreateInput = {
      submission_id: createFileSubmissionDto.submission_id,
      file_name: createFileSubmissionDto.filename,
      original_file_name: createFileSubmissionDto.original_filename,
      submission_date: createFileSubmissionDto.submission_date,
      submitter_user_id: createFileSubmissionDto.submitter_user_id,
      submission_status: { connect: { submission_status_code: "QUEUED" } },
      file_operation_codes: {
        connect: {
          file_operation_code: createFileSubmissionDto.file_operation_code,
        },
      },
      submitter_agency_name: createFileSubmissionDto.submitter_agency_name,
      sample_count: createFileSubmissionDto.sample_count,
      results_count: createFileSubmissionDto.result_count,
      // file_row_count: parseInt(createFileSubmissionDto.file_row_count, 10),
      active_ind: createFileSubmissionDto.active_ind,
      error_log: createFileSubmissionDto.error_log,
      organization_guid: createFileSubmissionDto.organization_guid,
      create_user_id: createFileSubmissionDto.create_user_id,
      create_utc_timestamp: createFileSubmissionDto.create_utc_timestamp,
      update_user_id: createFileSubmissionDto.update_user_id,
      update_utc_timestamp: createFileSubmissionDto.update_utc_timestamp,
    };

    // const newFile = await this.prisma.$transaction([
    //   this.prisma.file_submission.create({ data: newFilePostData }),
    // ]);

    // return newFile[0];
    return null
  }

  async createWithSftp(
    body: {
      userID: string;
      operation: string;
      agency: string;
      orgGUID: string;
    },
    file: Express.Multer.File,
  ) {
    const createFileSubmissionDto = new CreateFileSubmissionDto();

    // Call to function that makes API call to save file in the S3 bucket via COMS
    let newFileName = await saveToS3WithSftp(file);

    // Creating file DTO and inserting it in the database with the file GUID from the S3 bucket
    createFileSubmissionDto.submission_id = uuidv4(); // sftp to coms returns no coms submission id, generate random uuid instead
    createFileSubmissionDto.filename = newFileName;
    createFileSubmissionDto.original_filename = file.originalname;
    createFileSubmissionDto.submission_date = new Date();
    createFileSubmissionDto.submitter_user_id = body.userID;
    createFileSubmissionDto.submission_status_code = (
      await this.prisma.submission_status_code.findUnique({
        where: { submission_status_code: "QUEUED" },
      })
    ).submission_status_code;
    createFileSubmissionDto.file_operation_code = body.operation;
    createFileSubmissionDto.submitter_agency_name = body.agency;
    createFileSubmissionDto.sample_count = 0;
    createFileSubmissionDto.result_count = 0;
    createFileSubmissionDto.organization_guid = uuidv4();
    createFileSubmissionDto.create_user_id = body.userID;
    createFileSubmissionDto.create_utc_timestamp = new Date();
    createFileSubmissionDto.update_user_id = body.userID;
    createFileSubmissionDto.update_utc_timestamp = new Date();

    const newFilePostData: Prisma.file_submissionCreateInput = {
      submission_id: createFileSubmissionDto.submission_id,
      file_name: createFileSubmissionDto.filename,
      original_file_name: createFileSubmissionDto.original_filename,
      submission_date: createFileSubmissionDto.submission_date,
      submitter_user_id: createFileSubmissionDto.submitter_user_id,
      submission_status: { connect: { submission_status_code: "QUEUED" } },
      file_operation_codes: {
        connect: {
          file_operation_code: createFileSubmissionDto.file_operation_code,
        },
      },
      submitter_agency_name: createFileSubmissionDto.submitter_agency_name,
      sample_count: createFileSubmissionDto.sample_count,
      results_count: createFileSubmissionDto.result_count,
      active_ind: createFileSubmissionDto.active_ind,
      error_log: createFileSubmissionDto.error_log,
      organization_guid: createFileSubmissionDto.organization_guid,
      create_user_id: createFileSubmissionDto.create_user_id,
      create_utc_timestamp: createFileSubmissionDto.create_utc_timestamp,
      update_user_id: createFileSubmissionDto.update_user_id,
      update_utc_timestamp: createFileSubmissionDto.update_utc_timestamp,
    };

    const newFile = await this.prisma.$transaction([
      this.prisma.file_submission.create({ data: newFilePostData }),
    ]);

    return newFile[0];
  }

  async findByCode(submissionCode: string) {
    const query = {
      where: {
        submission_status_code: {
          equals: submissionCode,
        },
      },
    };

    const [results, count] = await this.prisma.$transaction([
      this.prisma.file_submission.findMany(query),

      this.prisma.file_submission.count({
        where: query.where,
      }),
    ]);

    return results;
  }

  async findBySearch(body: any): Promise<FileResultsWithCount<FileInfo>> {
    let records: FileResultsWithCount<FileInfo> = { count: 0, results: [] };

    let limit: number = +body.pageSize;
    let offset: number = body.page * limit;

    const whereClause = {
      original_file_name: {},
      submission_date: {},
      submitter_user_id: {},
      submitter_agency_name: {},
      submission_status_code: {},
      OR: [], // this is for the organization guid
      active_ind: true,
    };

    if (body.fileName) {
      whereClause.original_file_name = {
        contains: body.fileName,
      };
    }

    if (body.submissionDateFrom && body.submissionDateTo) {
      whereClause.submission_date = {
        gte: new Date(body.submissionDateFrom),
        lte: new Date(body.submissionDateTo),
      };
    } else if (body.submissionDateFrom) {
      whereClause.submission_date = {
        gte: new Date(body.submissionDateFrom),
      };
    } else if (body.submissionDateTo) {
      whereClause.submission_date = {
        lte: new Date(body.submissionDateTo),
      };
    }

    if (body.submitterUsername) {
      const usernames = body.submitterUsername
        .split(",")
        .map((item) => item.trim());
      whereClause.submitter_user_id = {
        in: usernames,
      };
    }

    if (body.submitterAgency) {
      const agencies = body.submitterAgency
        .split(",")
        .map((item) => item.trim());
      whereClause.submitter_agency_name = {
        in: agencies,
      };
    }

    if (body.fileStatus) {
      const statues = body.fileStatus.split(",").map((item) => item.trim());
      whereClause.submission_status_code = {
        in: statues,
      };
    }

    if (body.organization_guid !== "null") {
      whereClause.OR = [
        {
          organization_guid: { equals: body.organization_guid },
        },
        {
          organization_guid: null,
        },
      ];
    } else {
      whereClause.OR = [
        {
          organization_guid: null,
        },
      ];
    }

    const selectColumns = {
      submission_id: true,
      file_name: true,
      original_file_name: true,
      submission_date: true,
      submitter_user_id: true,
      submitter_agency_name: true,
      submission_status_code: true,
      sample_count: true,
      results_count: true,
    };

    const [results, count] = await this.prisma.$transaction([
      this.prisma.file_submission.findMany({
        take: limit,
        skip: offset,
        select: selectColumns,
        where: whereClause,
        orderBy: {
          create_utc_timestamp: "desc",
        },
      }),

      this.prisma.file_submission.count({
        where: whereClause,
      }),
    ]);

    records = { ...records, count, results };
    return records;
  }

  async updateFileStatus(submission_id: string, status: string) {
    await this.prisma.$transaction(async (prisma) => {
      const updateStatus = await this.prisma.file_submission.update({
        where: {
          submission_id: submission_id,
        },
        data: {
          submission_status_code: status,
          update_utc_timestamp: new Date(),
        },
      });
    });
  }

  async update(id: string, updateFileSubmissionDto: UpdateFileSubmissionDto) {
    try {
      const updateFileStatus = await this.prisma.file_submission.update({
        where: {
          submission_id: id,
        },
        data: {
          submission_status_code:
            updateFileSubmissionDto.submission_status_code,
        },
      });
    } catch (err) {
      this.logger.error(`Error updating file status: ${err.message}`);
    }
  }

  async remove(file_name: string, id: string) {
    try {
      await this.aqiService.deleteRelatedData(file_name, id);
      await this.prisma.$transaction(async (prisma) => {
        const updateFileStatus = await this.prisma.file_submission.update({
          where: {
            submission_id: id,
          },
          data: {
            submission_status_code: "DELETED",
            update_utc_timestamp: new Date(),
          },
        });
      });

      // don't delete the imported GUIDs, can be used again for deletion if deletion failed
      // await this.prisma.aqi_imported_data.deleteMany({
      //   where: {
      //     file_name: file_name,
      //   },
      // });

      return true;
    } catch (err) {
      this.logger.error(`Error deleting file: ${err.message}`);
      await this.prisma.$transaction(async (prisma) => {
        const updateFileStatus = await this.prisma.file_submission.update({
          where: {
            submission_id: id,
          },
          data: {
            submission_status_code: "DEL ERROR",
            update_utc_timestamp: new Date(),
          },
        });
      });
      return false;
    }
  }

  async getFromS3(fileName: string) {
    try {
      const fileStream = await this.objectStore.getFileData(fileName);
      const fileBinary: Uint8Array[] = [];
      return new Promise((resolve, reject) => {
        fileStream.on("data", (chunk: Uint8Array) => fileBinary.push(chunk));
        fileStream.on("end", () => resolve(Buffer.concat(fileBinary)));
        fileStream.on("error", (err: Error) => reject(err));
      });
    } catch (err) {
      this.logger.error(`Error fetching file from S3: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Grants the current IDIR user the ability to upload files to the S3 bucket
 * @param token
 */
async function grantBucketAccess(token: string) {
  const axios = require("axios");

  let config = {
    method: "put",
    url: `${process.env.COMS_URI}/v1/bucket`,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    data: {
      accessKeyId: process.env.OBJECTSTORE_ACCESS_KEY,
      bucket: process.env.OBJECTSTORE_BUCKET,
      bucketName: process.env.OBJECTSTORE_BUCKET,
      endpoint: process.env.OBJECTSTORE_URL,
      secretAccessKey: process.env.OBJECTSTORE_SECRET_KEY,
      active: true,
      key: "/",
      permCodes: ["CREATE"],
    },
  };

  await axios
    .request(config)
    .then((res) => res)
    .catch((err) => {
      console.log("create bucket failed");
      console.log(err);
    });
}

async function saveToS3(token: any, file: Express.Multer.File) {
  const path = require("path");
  let fileGUID = null;
  const originalFileName = file.originalname;
  const guid = crypto.randomUUID();
  const extention = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extention);
  const newFileName = `${baseName}-${guid}${extention}`;

  const axios = require("axios");

  await grantBucketAccess(token);

  let config = {
    method: "put",
    maxBodyLength: Infinity,
    url: `${process.env.COMS_URI}/v1/object?bucketId=${process.env.COMS_BUCKET_ID}`,
    headers: {
      "Content-Disposition": 'attachment; filename="' + newFileName + '"',
      "x-amz-meta-complaint-id": "23-000076",
      "Content-Type": file.mimetype,
      Authorization: "Bearer " + token,
    },
    data: file.buffer,
  };

  await axios.request(config).then((response) => {
    fileGUID = response.data.id;
  });

  return [fileGUID, newFileName];
}

async function saveToS3WithSftp(file: Express.Multer.File) {
  const path = require("path");
  const originalFileName = file.originalname;
  const guid = crypto.randomUUID();
  const extension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extension);
  const newFileName = `${baseName}-${guid}${extension}`;

  const OBJECTSTORE_URL = process.env.OBJECTSTORE_URL;
  const OBJECTSTORE_ACCESS_KEY = process.env.OBJECTSTORE_ACCESS_KEY;
  const OBJECTSTORE_SECRET_KEY = process.env.OBJECTSTORE_SECRET_KEY;
  const OBJECTSTORE_BUCKET = process.env.OBJECTSTORE_BUCKET;

  if (!OBJECTSTORE_URL) {
    throw new Error("Objectstore Host Not Defined");
  }

  const dateValue = new Date().toUTCString();

  // const stringToSign = `PUT\n\n\n${dateValue}\n/${OBJECTSTORE_BUCKET}/${newFileName}`;
  // const contentType = "application/octet-stream";
  const contentType = file.mimetype;
  const stringToSign = `PUT\n\n${contentType}\n${dateValue}\n/${OBJECTSTORE_BUCKET}/${newFileName}`;

  const signature = crypto
    .createHmac("sha1", OBJECTSTORE_SECRET_KEY)
    .update(stringToSign)
    .digest("base64");

  const requestUrl = `${OBJECTSTORE_URL}/${OBJECTSTORE_BUCKET}/${newFileName}`;

  const headers = {
    Authorization: `AWS ${OBJECTSTORE_ACCESS_KEY}:${signature}`,
    Date: dateValue,
    "Content-Type": contentType,
  };

  try {
    await axios({
      method: "put",
      url: requestUrl,
      headers: headers,
      data: file.buffer,
    });
    return newFileName;
  } catch (error) {
    console.error("Error uploading file to object store:", error);
    throw error;
  }
}
