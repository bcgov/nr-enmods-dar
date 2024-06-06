import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DryrunService } from './dryrun.service';
import { CreateDryrunDto } from './dto/create-dryrun.dto';
import { UpdateDryrunDto } from './dto/update-dryrun.dto';

@Controller('dryrun')
export class DryrunController {
  constructor(private readonly dryrunService: DryrunService) {}

  @Post()
  create(@Body() createDryrunDto: CreateDryrunDto) {
    console.log("I AM HERE!!!");
    return this.dryrunService.create(createDryrunDto);
  }

  @Get()
  findAll() {
    return this.dryrunService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dryrunService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDryrunDto: UpdateDryrunDto) {
    return this.dryrunService.update(+id, updateDryrunDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dryrunService.remove(+id);
  }
}
