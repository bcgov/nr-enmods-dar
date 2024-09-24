import { Injectable } from "@nestjs/common";
import { CreateFileSubmissionDto } from "./dto/create-file_submission.dto";
import { UpdateFileSubmissionDto } from "./dto/update-file_submission.dto";
import { PrismaService } from "nestjs-prisma";
import { FileResultsWithCount } from "src/interface/fileResultsWithCount";
import { file_submission, Prisma } from "@prisma/client";
import { FileInfo } from "src/types/types";
import { randomUUID } from "crypto";
import { ObjectStoreService } from "src/objectStore/objectStore.service";

@Injectable()
export class FileSubmissionsService {
  constructor(
    private prisma: PrismaService,
    private readonly objectStore: ObjectStoreService,
  ) {}

  async create(body: any, file: Express.Multer.File) {
    const createFileSubmissionDto = new CreateFileSubmissionDto();
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
    createFileSubmissionDto.submitter_agency_name = "SALUSSYSTEMS"; // TODO: change this once BCeID is set up
    createFileSubmissionDto.sample_count = 0;
    createFileSubmissionDto.result_count = 0;
    createFileSubmissionDto.organization_guid = body.orgGUID; // TODO: change this once BCeID is set up
    createFileSubmissionDto.create_user_id = body.userID;
    createFileSubmissionDto.create_utc_timestamp = new Date();
    createFileSubmissionDto.update_user_id = body.userID;
    createFileSubmissionDto.update_utc_timestamp = new Date();

    const newFilePostData: Prisma.file_submissionCreateInput = {
      submission_id: createFileSubmissionDto.submission_id,
      file_name: createFileSubmissionDto.filename,
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
      file_name: {},
      submission_date: {},
      submitter_user_id: {},
      submitter_agency_name: {},
      submission_status_code: {},
    };

    if (body.fileName) {
      whereClause.file_name = {
        contains: body.fileName,
      };
    }

    if (body.submissionDateFrom) {
      whereClause.submission_date = {
        gte: new Date(body.submissionDateFrom),
      };
    }

    if (body.submissionDateTo) {
      whereClause.submission_date = {
        ...whereClause.submission_date,
        lte: new Date(body.submissionDateTo),
      };
    }

    if (body.submitterUsername && body.submitterUsername != "ALL") {
      whereClause.submitter_user_id = {
        contains: body.submitterUsername,
      };
    }

    if (body.submitterAgency && body.submitterAgency != "ALL") {
      whereClause.submitter_agency_name = {
        contains: body.submitterAgency,
      };
    }

    if (body.fileStatus && body.fileStatus != "ALL") {
      whereClause.submission_status_code = {
        equals: body.fileStatus,
      };
    }

    const selectColumns = {
      submission_id: true,
      file_name: true,
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
    await this.prisma.file_submission.update({
      where: {
        submission_id: submission_id,
      },
      data: {
        submission_status_code: status,
      },
    });
  }

  update(id: number, updateFileSubmissionDto: UpdateFileSubmissionDto) {
    return `This action updates a #${id} fileSubmission`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileSubmission`;
  }

  async getFromS3(fileName: string) {
    try{
      const fileBinary = await this.objectStore.getFileData(fileName)
      return fileBinary
    } catch (err){
      console.error(`Error fetching file from S3: ${err.message}`);
      throw err;
    }
  }
}

async function saveToS3(token: any, file: Express.Multer.File) {
  const path = require("path");
  let fileGUID = null;
  const originalFileName = file.originalname;
  const guid = randomUUID();
  const extention = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extention);
  const newFileName = `${baseName}-${guid}${extention}`;

  const axios = require("axios");

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
