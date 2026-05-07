import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { ConsultationsModule } from "./consultations/consultations.module";
import { PaymentsModule } from "./payments/payments.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"], // .env local ou racine du monorepo
    }),
    PrismaModule,
    AuthModule,
    DoctorsModule,
    ConsultationsModule,
    PaymentsModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule {}
