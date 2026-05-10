import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DoctorModerationService {
  private readonly logger = new Logger(DoctorModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("0 0 3 * * *", { timeZone: "Africa/Casablanca" })
  async dailyModerationCheck() {
    this.logger.log("Running daily moderation check");

    const doctors = await this.prisma.doctor.findMany({
      where: { status: "VERIFIED" },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        qualityScore: true,
        totalRatings: true,
        user: { select: { email: true } },
        consultations: {
          where: { status: "COMPLETED" },
          orderBy: { endedAt: "desc" },
          take: 1,
          select: { endedAt: true },
        },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const doctor of doctors) {
      if (
        doctor.qualityScore !== null &&
        doctor.qualityScore < 4.0 &&
        doctor.totalRatings >= 20
      ) {
        await this.prisma.doctor.update({
          where: { id: doctor.id },
          data: {
            status: "SUSPENDED",
            suspensionReason: "Score qualité insuffisant (< 4.0/5 sur 20+ avis)",
            suspendedAt: new Date(),
            isAvailable: false,
          },
        });

        // Email notification — logged for MVP, to connect to Postmark in Brique 7
        this.logger.warn(
          `[MODERATION] Dr ${doctor.firstName} ${doctor.lastName} (${doctor.user.email}) suspended. ` +
          `Score: ${doctor.qualityScore?.toFixed(2)}, Ratings: ${doctor.totalRatings}`,
        );
      } else {
        const lastConsultation = doctor.consultations[0];
        if (lastConsultation?.endedAt && lastConsultation.endedAt < thirtyDaysAgo) {
          this.logger.log(
            `[MODERATION] Dr ${doctor.firstName} ${doctor.lastName} inactive >30 days (last: ${lastConsultation.endedAt.toISOString()})`,
          );
        }
      }
    }

    this.logger.log("Daily moderation check complete");
  }
}
