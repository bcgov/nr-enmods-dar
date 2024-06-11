import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete, Query, HttpException,
} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {UsersService} from "./users.service";
import {CreateUserDto} from "./dto/create-user.dto";
import {UpdateUserDto} from "./dto/update-user.dto";
import { UserDto } from "./dto/user.dto";
import { Role } from "../enum/role.enum";
import { Roles } from "../auth/decorators/roles.decorators";


@ApiTags("users")
@Controller({path: "users", version: "1"})
export class UsersController {
  constructor(private readonly usersService: UsersService) {
  }

  @Post()
  @Roles(Role.ENMODS_ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ENMODS_ADMIN)
  findAll() : Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Get("search") // it must be ahead of the below Get(":id") to avoid conflict
  @Roles(Role.ENMODS_ADMIN)
  async searchUsers(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("sort") sort: string, // JSON string to store sort key and sort value, ex: {name: "ASC"}
    @Query("filter") filter: string // JSON array for key, operation and value, ex: [{key: "name", operation: "like", value: "Peter"}]
  ) {
    if (isNaN(page) || isNaN(limit)) {
      throw new HttpException("Invalid query parameters", 400);
    }
    return this.usersService.searchUsers(page, limit, sort, filter);
  }

  @Get(":id")
  @Roles(Role.ENMODS_ADMIN)
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findOne(+id);
    if (!user) {
      throw new HttpException("User not found.", 404);
    }
    return user;
  }

  @Put(":id")
  @Roles(Role.ENMODS_ADMIN)
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(":id")
  @Roles(Role.ENMODS_ADMIN)
  remove(@Param("id") id: string) {
    return this.usersService.remove(+id);
  }


}
