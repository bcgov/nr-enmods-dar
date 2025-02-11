import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtAuthStrategy.name);

  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.JWKS_URI,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.KEYCLOAK_CLIENT_ID,
      issuer: process.env.JWT_ISSUER,
      algorithms: ["RS256"],
    });
  }
  validate(payload: unknown): unknown {
    return payload;
  }
}
