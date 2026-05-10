import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { QueueModule } from "../queue/queue.module";
import { PreConsultController, SymptomsController } from "./pre-consult.controller";
import { PreConsultService } from "./pre-consult.service";

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [PreConsultController, SymptomsController],
  providers: [PreConsultService],
})
export class PreConsultModule {}
