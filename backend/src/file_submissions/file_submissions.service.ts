import { Injectable } from '@nestjs/common';
import { CreateFileSubmissionDto } from './dto/create-file_submission.dto';
import { UpdateFileSubmissionDto } from './dto/update-file_submission.dto';

@Injectable()
export class FileSubmissionsService {
  create(createFileSubmissionDto: CreateFileSubmissionDto) {
    console.log("I WILL SEND THE POST FROM HERE!!!");
    return 'This action adds a new fileSubmission';
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
