import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { PrismaModule } from "../prisma/prisma.module";
import { InvoicesService } from "./invoices.service";
import { InvoicesController, AdminBillingController } from "./invoices.controller";
import { PdfGeneratorService } from "./pdf-generator.service";
import { InvoiceNumberingService, INVOICES_REDIS_CLIENT } from "./invoice-numbering.service";
import { MonthlyBillingScheduler } from "./monthly-billing.scheduler";

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController, AdminBillingController],
  providers: [
    {
      provide: INVOICES_REDIS_CLIENT,
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>("REDIS_URL", "redis://localhost:6379")),
      inject: [ConfigService],
    },
    InvoiceNumberingService,
    PdfGeneratorService,
    InvoicesService,
    MonthlyBillingScheduler,
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
