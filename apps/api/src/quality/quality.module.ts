import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QualityScoreService } from "./quality-score.service";
import { DoctorModerationService } from "./doctor-moderation.service";

@Module({
  imports: [PrismaModule],
  providers: [QualityScoreService, DoctorModerationService],
  exports: [QualityScoreService],
})
export class QualityModule {}
