import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PaymentProviderModule } from "./payment-provider.module";
import { QueueModule } from "../queue/queue.module";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";

@Module({
  imports: [PrismaModule, PaymentProviderModule, QueueModule],
  providers: [PaymentsService, RolesGuard],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
