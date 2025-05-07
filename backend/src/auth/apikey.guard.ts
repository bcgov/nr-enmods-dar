import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"];

    if (apiKey && apiKey === process.env.UPLOAD_FILE_API_KEY) {
      return true;
    } else {
      throw new UnauthorizedException("Invalid or missing API key");
    }
  }
}
