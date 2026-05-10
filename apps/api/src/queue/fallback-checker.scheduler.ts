import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Checks every 60s for patients in a referring queue who have been waiting
 * more than 20 min. Does NOT auto-fallback — the frontend handles the proposal UI.
 * In V2, this scheduler will send push/email notifications.
 */
@Injectable()
export class FallbackCheckerScheduler {
  private readonly logger = new Logger(FallbackCheckerScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("0 * * * * *") // every 60 seconds
  async checkReferringTimeouts() {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const stale = await this.prisma.consultation.findMany({
      where: {
        status: "IN_QUEUE",
        isReferringRequest: true,
        requestedDoctorId: { not: null },
        queuedAt: { lt: twentyMinutesAgo },
      },
      select: {
        id: true,
        requestedDoctorId: true,
        queuedAt: true,
        patient: { select: { firstName: true } },
      },
      take: 100,
    });

    if (stale.length > 0) {
      this.logger.warn(
        `${stale.length} referring consultation(s) waiting >20 min. ` +
        `IDs: ${stale.map((c) => c.id).join(", ")}. ` +
        `V2: send push/email notification to propose fallback.`,
      );
    }
  }
}
