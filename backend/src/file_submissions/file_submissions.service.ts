import { Injectable } from '@nestjs/common';
import { CreateFileSubmissionDto } from './dto/create-file_submission.dto';
import { UpdateFileSubmissionDto } from './dto/update-file_submission.dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class FileSubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(body: any, file: Express.Multer.File) {
    const createFileSubmissionDto = new CreateFileSubmissionDto();
    /*
      TODO:
      - Create a new record in the file_submissions table with the submission_status_code set to INPROGRESS
      - Do the initial validation first (validate the fields in the file that are not in the AQI API)
      - Once the initial validation has passed, then call the AQI API on the rest of the fields. If failed, set the submission_status_code to FAILED, populate error_log column and return with error message.
      - Once the AQI API call is done, then update the submission_status_code field in the database to PASSED. If failed, set the submission_status_code to FAILED, populate error_log column and return with error message.
    */

    createFileSubmissionDto.filename = file.originalname;
    createFileSubmissionDto.submission_date = new Date();
    createFileSubmissionDto.submitter_user_id = body.userID;
    createFileSubmissionDto.submission_status_code = (await this.prisma.submission_status_code.findUnique({where: {submission_status_code: "INPROGRESS"}})).submission_status_code;
    createFileSubmissionDto.submitter_agency_name = 'SALUSSYSTEMS'; // TODO: change this once BCeID is set up
    createFileSubmissionDto.sample_count = 0;
    createFileSubmissionDto.result_count = 0;
    createFileSubmissionDto.organization_guid = body.orgGUID; // TODO: change this once BCeID is set up
    createFileSubmissionDto.create_user_id = body.userID;
    createFileSubmissionDto.create_utc_timestamp = new Date();
    createFileSubmissionDto.update_user_id = body.userID;
    createFileSubmissionDto.update_utc_timestamp = new Date();

    const File_submissions = await this.prisma.file_submissions.create({
      data: {
        file_name: createFileSubmissionDto.filename,
        submission_date: createFileSubmissionDto.submission_date,
        submitter_user_id: createFileSubmissionDto.submitter_user_id,
        submission_status_code: { connect: {submission_status_code: "INPROGRESS"}},
        submitter_agency_name: createFileSubmissionDto.submitter_agency_name,
        sample_count: createFileSubmissionDto.sample_count,
        results_count: createFileSubmissionDto.result_count,
        active_ind: createFileSubmissionDto.active_ind,
        error_log: createFileSubmissionDto.error_log,
        organization_guid: createFileSubmissionDto.organization_guid,
        create_user_id: createFileSubmissionDto.create_user_id,
        create_utc_timestamp: createFileSubmissionDto.create_utc_timestamp,
      }
    })
  }

  findAll() {
    return `This action returns all fileSubmissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fileSubmission`;
  }

  update(id: number, updateFileSubmissionDto: UpdateFileSubmissionDto) {
    return `This action updates a #${id} fileSubmission`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileSubmission`;
  }
}
