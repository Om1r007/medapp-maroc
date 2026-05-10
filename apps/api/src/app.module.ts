import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { ConsultationsModule } from "./consultations/consultations.module";
import { PaymentsModule } from "./payments/payments.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";
import { AvailabilityModule } from "./availability/availability.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PatientsModule } from "./patients/patients.module";
import { RatingsModule } from "./ratings/ratings.module";
import { QualityModule } from "./quality/quality.module";
import { AdminModule } from "./admin/admin.module";
import { PreConsultModule } from "./pre-consult/pre-consult.module";
import { SharingModule } from "./sharing/sharing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"], // .env local ou racine du monorepo
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "storage"),
      serveRoot: "/static",
    }),
    PrismaModule,
    AuthModule,
    DoctorsModule,
    ConsultationsModule,
    PaymentsModule,
    QueueModule,
    HealthModule,
    AvailabilityModule,
    InvoicesModule,
    PatientsModule,
    RatingsModule,
    QualityModule,
    AdminModule,
    PreConsultModule,
    SharingModule,
  ],
})
export class AppModule {}
