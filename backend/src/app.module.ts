import "dotenv/config";
import {
  Logger,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TerminusModule } from "@nestjs/terminus";
import { HTTPLoggerMiddleware } from "./middleware/req.res.logger";
import { loggingMiddleware, PrismaModule } from "nestjs-prisma";
import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { MetricsController } from "./metrics.controller";
import { HealthController } from "./health.controller";
import { JWTAuthModule } from "./auth/jwtauth.module";
import { AdminModule } from "./admin/admin.module";
import { FileSubmissionsModule } from "./file_submissions/file_submissions.module";
import { FileStatusCodesModule } from "./file_status_codes/file_status_codes.module";
import { CronJobService } from "./cron-job/cron-job.service";
import { NotificationsModule } from "./notifications/notifications.module";
import { AqiApiModule } from "./aqi_api/aqi_api.module";
import { FileParseValidateModule } from "./file_parse_and_validation/file_parse_and_validation.module";
import { SftpModule } from "./sftp/sftp.module";
import { FileValidationModule } from "./file_validation/file_validation.module";
import { ObjectStoreModule } from "./objectStore/objectStore.module";
import { FileErrorLogsModule } from "./file_error_logs/file_error_logs.module";
import { OperationLockService } from "./operationLock/operationLock.service";
import { ApiKeysModule } from "./api_keys/api_keys.module";
import { CacheModule } from "./cache/cache.module";

const DB_HOST = process.env.POSTGRES_HOST || "localhost";
const DB_USER = process.env.POSTGRES_USER || "postgres";
const DB_PWD = encodeURIComponent(process.env.POSTGRES_PASSWORD || "default"); // this needs to be encoded, if the password contains special characters it will break connection string.
const DB_PORT = process.env.POSTGRES_PORT || 5432;
const DB_NAME = process.env.POSTGRES_DATABASE || "postgres";
const DB_SCHEMA = process.env.POSTGRES_SCHEMA || "enmods";
const dataSourceURL = `postgresql://${DB_USER}:${DB_PWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&connection_limit=5`;

function getMiddlewares() {
  if (process.env.PRISMA_LOGGING) {
    return [
      // configure your prisma middleware
      loggingMiddleware({
        logger: new Logger("PrismaMiddleware"),
        logLevel: "debug",
      }),
    ];
  }
  return [];
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    TerminusModule,
    ScheduleModule.forRoot(),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        prismaOptions: {
          log: ["error", "warn"],
          errorFormat: "pretty",
          datasourceUrl: dataSourceURL,
        },
        middlewares: getMiddlewares(),
      },
    }),
    JWTAuthModule,
    AdminModule,
    FileSubmissionsModule,
    NotificationsModule,
    FileStatusCodesModule,
    FileParseValidateModule,
    AqiApiModule,
    SftpModule,
    FileValidationModule,
    ObjectStoreModule,
    FileErrorLogsModule,
    ApiKeysModule,
    CacheModule,
  ],
  controllers: [AppController, MetricsController, HealthController],
  providers: [AppService, CronJobService, OperationLockService],
})
export class AppModule {
  // let's add a middleware on all routes
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HTTPLoggerMiddleware)
      .exclude(
        { path: "metrics", method: RequestMethod.ALL },
        { path: "health", method: RequestMethod.ALL },
      )
      .forRoutes("*");
  }
}
