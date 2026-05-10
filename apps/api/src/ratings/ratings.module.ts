import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QualityModule } from "../quality/quality.module";
import { RatingsController } from "./ratings.controller";
import { RatingsService } from "./ratings.service";

@Module({
  imports: [PrismaModule, QualityModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
