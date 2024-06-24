import { Injectable } from '@nestjs/common';
import { CreateFileStatusCodeDto } from './dto/create-file_status_code.dto';
import { UpdateFileStatusCodeDto } from './dto/update-file_status_code.dto';

@Injectable()
export class FileStatusCodesService {
  create(createFileStatusCodeDto: CreateFileStatusCodeDto) {
    return 'This action adds a new fileStatusCode';
  }

  findAll() {
    
    return `This action returns all fileStatusCodes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fileStatusCode`;
  }

  update(id: number, updateFileStatusCodeDto: UpdateFileStatusCodeDto) {
    return `This action updates a #${id} fileStatusCode`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileStatusCode`;
  }
}
