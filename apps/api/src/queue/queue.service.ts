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

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { requestedDoctorId: true },
    });

    if (consultation?.requestedDoctorId) {
      // Referring mode: try to match ONLY with the requested doctor
      const requestedDoctor = await this.prisma.doctor.findUnique({
        where: { id: consultation.requestedDoctorId, status: "VERIFIED", isAvailable: true },
        select: { id: true },
      });
      if (requestedDoctor) {
        await this.tryMatch(requestedDoctor.id);
      }
    } else {
      // Standard mode: match with any available doctor
      const availableDoctor = await this.prisma.doctor.findFirst({
        where: { status: "VERIFIED", isAvailable: true },
        select: { id: true },
      });
      if (availableDoctor) {
        await this.tryMatch(availableDoctor.id);
      }
    }
  }

  async getPosition(
    consultationId: string,
  ): Promise<{ position: number; totalInQueue: number }> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { queuedAt: true, status: true, requestedDoctorId: true },
    });

    if (!consultation?.queuedAt) return { position: 0, totalInQueue: 0 };

    // Position is relative to the sub-queue (referring or global)
    const queueFilter = consultation.requestedDoctorId
      ? { requestedDoctorId: consultation.requestedDoctorId }
      : { requestedDoctorId: null as string | null };

    const [before, total] = await Promise.all([
      this.prisma.consultation.count({
        where: { status: "IN_QUEUE", ...queueFilter, queuedAt: { lt: consultation.queuedAt } },
      }),
      this.prisma.consultation.count({
        where: { status: "IN_QUEUE", ...queueFilter },
      }),
    ]);

    return { position: before + 1, totalInQueue: total };
  }

  /**
   * Round-robin between referring queue (requestedDoctorId = doctorId)
   * and global queue (requestedDoctorId = null) to prevent starvation.
   */
  async tryMatch(doctorId: string): Promise<{ id: string; patientId: string; reason: string | null; status: string } | null> {
    const lockKey = "queue:try-match:lock";
    const lockValue = `${doctorId}-${Date.now()}`;

    const acquired = await this.redis.set(lockKey, lockValue, "EX", 5, "NX");
    if (!acquired) return null;

    try {
      const lastMatchType = await this.redis.get(`doctor:${doctorId}:lastMatchType`);
      // If last match was referring → try global first (anti-starvation)
      const referringFirst = lastMatchType !== "referring";

      let consultation = null;
      let matchType: "referring" | "global" = "global";

      if (referringFirst) {
        // Try referring queue first
        consultation = await this.prisma.consultation.findFirst({
          where: { status: "IN_QUEUE", requestedDoctorId: doctorId },
          orderBy: { queuedAt: "asc" },
        });
        if (consultation) {
          matchType = "referring";
        } else {
          // Fallback to global queue
          consultation = await this.prisma.consultation.findFirst({
            where: { status: "IN_QUEUE", requestedDoctorId: null },
            orderBy: { queuedAt: "asc" },
          });
          matchType = "global";
        }
      } else {
        // Try global queue first
        consultation = await this.prisma.consultation.findFirst({
          where: { status: "IN_QUEUE", requestedDoctorId: null },
          orderBy: { queuedAt: "asc" },
        });
        if (consultation) {
          matchType = "global";
        } else {
          // Fallback to referring queue
          consultation = await this.prisma.consultation.findFirst({
            where: { status: "IN_QUEUE", requestedDoctorId: doctorId },
            orderBy: { queuedAt: "asc" },
          });
          matchType = "referring";
        }
      }

      if (!consultation) return null;

      const matched = await this.prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: "MATCHED", doctorId, matchedAt: new Date() },
        select: { id: true, patientId: true, reason: true, status: true },
      });

      // Persist round-robin state (24h TTL)
      await this.redis.set(`doctor:${doctorId}:lastMatchType`, matchType, "EX", 86400);
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

  /** Estimate wait time for a specific doctor (referring mode indicator) */
  async getNextAvailabilityForDoctor(doctorId: string): Promise<{
    isAvailableNow: boolean;
    estimatedWaitMinutes: number;
    doctorName: string;
  }> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { isAvailable: true, firstName: true, lastName: true, status: true },
    });

    if (!doctor || doctor.status !== "VERIFIED") {
      return { isAvailableNow: false, estimatedWaitMinutes: 999, doctorName: "" };
    }

    // Count patients specifically queued for this doctor
    const referringQueueLength = await this.prisma.consultation.count({
      where: { status: "IN_QUEUE", requestedDoctorId: doctorId },
    });

    const avgMin = this.config.get<number>("AVG_CONSULTATION_MINUTES", 4);
    const bufferMin = 5;
    const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName[0]}.`;

    if (doctor.isAvailable && referringQueueLength === 0) {
      return { isAvailableNow: true, estimatedWaitMinutes: 0, doctorName };
    }

    const estimatedWaitMinutes = Math.min(90, referringQueueLength * avgMin + bufferMin);
    return { isAvailableNow: false, estimatedWaitMinutes, doctorName };
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
