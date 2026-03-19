import { Module, forwardRef } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { HttpModule } from "@nestjs/axios";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [HttpModule, forwardRef(() => NotificationsModule)],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
