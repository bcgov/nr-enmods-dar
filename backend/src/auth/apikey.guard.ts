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

    console.log("Received API Key:", apiKey);
    console.log("Expected API Key:", process.env.UPLOAD_FILE_API_KEY);

    if (apiKey && apiKey === process.env.UPLOAD_FILE_API_KEY) {
      return true;
    } else {
      throw new UnauthorizedException("Invalid or missing API key");
    }
  }
}
