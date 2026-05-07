import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentProviderModule } from "../payments/payment-provider.module";
import { QueueModule } from "../queue/queue.module";
import { VideoModule } from "../video/video.module";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ConsultationsController } from "./consultations.controller";
import { ConsultationsService } from "./consultations.service";

@Module({
  imports: [PrismaModule, PaymentProviderModule, QueueModule, VideoModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, RolesGuard],
})
export class ConsultationsModule {}
