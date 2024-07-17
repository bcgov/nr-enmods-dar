import { Injectable } from '@nestjs/common';
import { CreateFileStatusCodeDto } from './dto/create-file_status_code.dto';
import { UpdateFileStatusCodeDto } from './dto/update-file_status_code.dto';
import { PrismaService } from 'nestjs-prisma';
import { FileStatusCode } from './dto/file_status_codes.dto';

@Injectable()
export class FileStatusCodesService {
  constructor(private prisma: PrismaService) {}

  create(createFileStatusCodeDto: CreateFileStatusCodeDto) {
    return 'This action adds a new fileStatusCode';
  }

  async findAll(): Promise<FileStatusCode[]> {
    const fileStatusCodes = await this.prisma.submission_status_code.findMany();
    return fileStatusCodes
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
