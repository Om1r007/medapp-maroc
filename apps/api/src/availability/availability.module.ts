import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QueueModule } from "../queue/queue.module";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";
import { AvailabilitySchedulerService } from "./availability-scheduler.service";
import { DoctorVerifiedGuard } from "../auth/guards/doctor-verified.guard";

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilitySchedulerService, DoctorVerifiedGuard],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
