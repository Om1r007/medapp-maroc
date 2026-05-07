import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QueueModule } from "../queue/queue.module";
import { VideoModule } from "../video/video.module";
import { DoctorsController } from "./doctors.controller";
import { DoctorsService } from "./doctors.service";
import { DoctorVerifiedGuard } from "../auth/guards/doctor-verified.guard";

@Module({
  imports: [PrismaModule, QueueModule, VideoModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorVerifiedGuard],
})
export class DoctorsModule {}
