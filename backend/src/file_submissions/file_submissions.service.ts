import { Injectable } from "@nestjs/common";
import { CreateFileSubmissionDto } from "./dto/create-file_submission.dto";
import { UpdateFileSubmissionDto } from "./dto/update-file_submission.dto";
import { PrismaService } from "nestjs-prisma";
import { PrismaClient, Prisma } from "@prisma/client";
import { FileResultsWithCount } from "src/interface/fileResultsWithCount";
import { file_submission } from '@prisma/client'
import { FileInfo } from "src/types/types";

@Injectable()
export class FileSubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(body: any, file: Express.Multer.File) {
    const createFileSubmissionDto = new CreateFileSubmissionDto();
    /*
      TODO:
      - Create a new record in the file_submissions table with the submission_status_code set to INPROGRESS
      - Crrate a record in the S3 bucket for this file, use the newly created file submission_id when uploading to S3 for future reference
    */

    createFileSubmissionDto.filename = file.originalname;
    createFileSubmissionDto.submission_date = new Date();
    createFileSubmissionDto.submitter_user_id = body.userID;
    createFileSubmissionDto.submission_status_code = (
      await this.prisma.submission_status_code.findUnique({
        where: { submission_status_code: "INPROGRESS" },
      })
    ).submission_status_code;
    createFileSubmissionDto.submitter_agency_name = "SALUSSYSTEMS"; // TODO: change this once BCeID is set up
    createFileSubmissionDto.sample_count = 0;
    createFileSubmissionDto.result_count = 0;
    createFileSubmissionDto.organization_guid = body.orgGUID; // TODO: change this once BCeID is set up
    createFileSubmissionDto.create_user_id = body.userID;
    createFileSubmissionDto.create_utc_timestamp = new Date();
    createFileSubmissionDto.update_user_id = body.userID;
    createFileSubmissionDto.update_utc_timestamp = new Date();

    const newFilePostData: Prisma.file_submissionCreateInput = {
      file_name: createFileSubmissionDto.filename,
      submission_date: createFileSubmissionDto.submission_date,
      submitter_user_id: createFileSubmissionDto.submitter_user_id,
      submission_status: { connect: { submission_status_code: "INPROGRESS" } },
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

  findAll() {
    return `This action returns all fileSubmissions`;
  }

  async findBySearch(body: any): Promise<FileResultsWithCount<FileInfo>>{
    let records: FileResultsWithCount<FileInfo> = { count: 0, results: [] };

    const statusFilter = body.fileStatus !== 'ALL' ? { submission_status_code: body.fileStatus } : {}
    const selectColumns = {
      submission_id: true,
      file_name: true,
      submission_date: true,
      submitter_user_id: true,
      submitter_agency_name: true,
      submission_status_code: true,
      sample_count: true,
      results_count: true
    }

    const query = {
      file_name: {
        startsWith: body.fileName
      },
      ...statusFilter
    }

    const [results, count] = await this.prisma.$transaction([
      this.prisma.file_submission.findMany( {where: query, select: selectColumns} ),

      this.prisma.file_submission.count({
        where:
          query
      }),
    ])

    console.log(results)
    records = { ...records, count, results };
    return records;
  }

  async findOne(id: string): Promise<FileResultsWithCount<file_submission>> {
    let records: FileResultsWithCount<file_submission> = { count: 0, results: [] };
    /*
      TODO: 
      - Find the file_submission record with the submission_id = id
      - Grab the file from the S3 bucket
      - Do the initial validation first (validate the fields in the file that are not in the AQI API). if failed, set the submission_status_code to FAILED, populate the error_log column and return with the error message.
      - Once the initial validation has passed, then call the AQI API on the rest of the fields. If failed, set the submission_status_code to FAILED, populate error_log column and return with error message.
      - Once the AQI API call is done, then update the submission_status_code field in the database to PASSED. If failed, set the submission_status_code to FAILED, populate error_log column and return with error message.
    */

    const query = {
      where: {
        file_name: {
          contains: id,
        },
      },
    };

    const [results, count] = await this.prisma.$transaction([
      this.prisma.file_submission.findMany( query ),

      this.prisma.file_submission.count({
        where:
          query.where
      }),
    ])
    
    records = { ...records, count, results };
    return records;
  }

  update(id: number, updateFileSubmissionDto: UpdateFileSubmissionDto) {
    return `This action updates a #${id} fileSubmission`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileSubmission`;
  }
}
