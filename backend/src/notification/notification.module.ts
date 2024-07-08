import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
