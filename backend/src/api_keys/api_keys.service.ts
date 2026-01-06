import { Injectable } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";

import { UpdateApiKeyDto } from "./dto/update-api_key.dto";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import { CreateApiKeyDto } from "./dto/create-api_key.dto";

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateApiKeyDto) {
    const apiKey = crypto.randomBytes(32).toString("hex");
    const now = new Date();
    return this.prisma.api_keys.create({
      data: {
        api_key: apiKey,
        email_address: data.email_address,
        organization_name: data.organization_name,
        usage_count: 0,
        enabled_ind: true,
        create_user_id: data.create_user_id,
        create_utc_timestamp: now,
        update_user_id: data.update_user_id,
        update_utc_timestamp: now,
      },
    });
  }

  async findAll() {
    return this.prisma.api_keys.findMany();
  }

  async findOne(id: string) {
    return this.prisma.api_keys.findUnique({ where: { api_key_id: id } });
  }

  async update(id: string, data: UpdateApiKeyDto) {
    const updateData = { ...data };

    // Only update the timestamp if more than just last_used_utc_timestamp changed
    const isOnlyLastUsedChanged =
      Object.keys(data).length === 1 && "last_used_utc_timestamp" in data;

    if (!isOnlyLastUsedChanged) {
      updateData.update_utc_timestamp = new Date();
    }

    return this.prisma.api_keys.update({
      where: { api_key_id: id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.api_keys.delete({ where: { api_key_id: id } });
  }
}
