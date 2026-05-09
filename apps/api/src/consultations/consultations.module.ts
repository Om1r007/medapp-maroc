import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentProviderModule } from "../payments/payment-provider.module";
import { QueueModule } from "../queue/queue.module";
import { VideoModule } from "../video/video.module";
import { InvoicesModule } from "../invoices/invoices.module";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ConsultationsController } from "./consultations.controller";
import { ConsultationsService } from "./consultations.service";
import { AutoCloseSchedulerService } from "./auto-close-scheduler.service";

@Module({
  imports: [PrismaModule, PaymentProviderModule, QueueModule, VideoModule, InvoicesModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, AutoCloseSchedulerService, RolesGuard],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
