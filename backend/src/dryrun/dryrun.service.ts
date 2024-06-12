import { Injectable } from '@nestjs/common';
import { CreateDryrunDto } from './dto/create-dryrun.dto';
import { UpdateDryrunDto } from './dto/update-dryrun.dto';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from "@prisma/client";
import { DryrunDto } from './dto/dryrun.dto';

@Injectable()
export class DryrunService {
  constructor(
    private prisma: PrismaService
  ) {
  }
  
  create(createDryrunDto: CreateDryrunDto) {
    console.log("I WILL SEND THE POST FROM HERE!!!");
    return 'This action adds a new dryrun';
  }

  async findAll() {
    const files = await this.prisma.file_submissions.findMany();
    console.log(files)
  }

  findOne(id: number) {
    return `This action returns a #${id} dryrun`;
  }

  update(id: number, updateDryrunDto: UpdateDryrunDto) {
    return `This action updates a #${id} dryrun`;
  }

  remove(id: number) {
    return `This action removes a #${id} dryrun`;
  }
}
