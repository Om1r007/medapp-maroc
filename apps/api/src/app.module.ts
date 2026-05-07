import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { ConsultationsModule } from "./consultations/consultations.module";
import { PaymentsModule } from "./payments/payments.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";
import { AvailabilityModule } from "./availability/availability.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"], // .env local ou racine du monorepo
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DoctorsModule,
    ConsultationsModule,
    PaymentsModule,
    QueueModule,
    HealthModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
