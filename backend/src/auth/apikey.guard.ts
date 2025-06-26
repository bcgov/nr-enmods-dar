import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "nestjs-prisma";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new UnauthorizedException("API key missing");
    }

    const apiKeyRecord = await this.prisma.api_keys.findFirst({
      where: {
        api_key: apiKey,
        enabled_ind: true,
        revoked_date: null,
      },
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException("Invalid or revoked API key");
    }

    // increment usage_count and update last_used_date
    await this.prisma.api_keys.update({
      where: { api_key_id: apiKeyRecord.api_key_id },
      data: {
        usage_count: { increment: 1 },
        last_used_date: new Date(),
      },
    });

    return true;
  }
}
