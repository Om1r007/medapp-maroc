import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import Redis from "ioredis";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentProviderModule } from "../payments/payment-provider.module";
import {
  CONSULTATION_TIMEOUT_QUEUE,
  REDIS_CLIENT,
  QueueService,
} from "./queue.service";
import { QueueProcessor } from "./queue.processor";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>("REDIS_URL", "redis://localhost:6379");
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || "6379"),
            ...(url.password
              ? { password: decodeURIComponent(url.password) }
              : {}),
          },
        };
      },
    }),
    BullModule.registerQueue({ name: CONSULTATION_TIMEOUT_QUEUE }),
    PrismaModule,
    PaymentProviderModule,
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        return new Redis(
          config.get<string>("REDIS_URL", "redis://localhost:6379"),
        );
      },
      inject: [ConfigService],
    },
    QueueService,
    QueueProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
