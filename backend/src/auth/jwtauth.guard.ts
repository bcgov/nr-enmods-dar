import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "./decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    } else {
      return super.canActivate(context);
    }
  }
  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || "unknown route";
    const method = request.method || "unknown method";

    if (err || !user) {
      this.logger.error(
        `JWT is not valid. Err: ${err}. - User: ${user}. Info: ${info}. Route: ${method} ${route}`,
      );
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
