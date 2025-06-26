import { Module } from "@nestjs/common";
import { ApiKeysService } from "./api_keys.service";
import { ApiKeysController } from "./api_keys.controller";
import { PrismaService } from "nestjs-prisma";

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, PrismaService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
