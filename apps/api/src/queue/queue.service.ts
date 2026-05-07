import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import type Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from "../payments/payment-provider.interface";

export const CONSULTATION_TIMEOUT_QUEUE = "consultation-timeout";
export const REDIS_CLIENT = "REDIS_CLIENT";

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(CONSULTATION_TIMEOUT_QUEUE) private readonly timeoutQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async enqueue(consultationId: string): Promise<void> {
    await this.scheduleTimeout(consultationId);
  }

  async getPosition(
    consultationId: string,
  ): Promise<{ position: number; totalInQueue: number }> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { queuedAt: true, status: true },
    });

    if (!consultation?.queuedAt) return { position: 0, totalInQueue: 0 };

    const [before, total] = await Promise.all([
      this.prisma.consultation.count({
        where: { status: "IN_QUEUE", queuedAt: { lt: consultation.queuedAt } },
      }),
      this.prisma.consultation.count({ where: { status: "IN_QUEUE" } }),
    ]);

    return { position: before + 1, totalInQueue: total };
  }

  async tryMatch(doctorId: string): Promise<{ id: string; patientId: string; reason: string | null; status: string } | null> {
    const lockKey = "queue:try-match:lock";
    const lockValue = `${doctorId}-${Date.now()}`;

    const acquired = await this.redis.set(lockKey, lockValue, "EX", 5, "NX");
    if (!acquired) return null;

    try {
      const consultation = await this.prisma.consultation.findFirst({
        where: { status: "IN_QUEUE" },
        orderBy: { queuedAt: "asc" },
      });

      if (!consultation) return null;

      const matched = await this.prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: "MATCHED", doctorId, matchedAt: new Date() },
        select: { id: true, patientId: true, reason: true, status: true },
      });

      await this.cancelTimeoutJob(consultation.id);
      return matched;
    } finally {
      const current = await this.redis.get(lockKey);
      if (current === lockValue) await this.redis.del(lockKey);
    }
  }

  async removeFromQueue(consultationId: string): Promise<void> {
    await this.cancelTimeoutJob(consultationId);
  }

  async requeue(consultationId: string): Promise<void> {
    // Epoch + 1 ms → front of queue (oldest queuedAt)
    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: "IN_QUEUE",
        doctorId: null,
        matchedAt: null,
        queuedAt: new Date(1),
      },
    });
    await this.scheduleTimeout(consultationId);
  }

  async refundAndClose(consultationId: string): Promise<void> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation || consultation.status !== "IN_QUEUE") return;

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    });

    if (consultation.paymentRef) {
      await this.paymentProvider.refund(consultation.paymentRef);
    }
  }

  private async scheduleTimeout(consultationId: string): Promise<void> {
    const minutes = this.config.get<number>("QUEUE_TIMEOUT_MINUTES", 15);
    await this.timeoutQueue.add(
      "timeout",
      { consultationId },
      {
        delay: minutes * 60 * 1000,
        jobId: `timeout-${consultationId}`,
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  private async cancelTimeoutJob(consultationId: string): Promise<void> {
    const job = await this.timeoutQueue.getJob(`timeout-${consultationId}`);
    if (job) await job.remove();
  }
}
