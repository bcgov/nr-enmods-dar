import { Injectable } from '@nestjs/common';
import { CreateDryrunDto } from './dto/create-dryrun.dto';
import { UpdateDryrunDto } from './dto/update-dryrun.dto';

@Injectable()
export class DryrunService {
  create(createDryrunDto: CreateDryrunDto) {
    console.log("I WILL SEND THE POST FROM HERE!!!");
    return 'This action adds a new dryrun';
  }

  findAll() {
    return `This action returns all dryrun`;
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
