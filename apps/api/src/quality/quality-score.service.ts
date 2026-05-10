import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const BADGE_LABELS = {
  PREMIUM: "Médecin Premium",
  EXPERIENCED: "Expérimenté",
  REACTIVE: "Réactif",
  VETERAN: "Vétéran Medapp",
  BILINGUAL: "Bilingue",
} as const;

@Injectable()
export class QualityScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async recalculate(doctorId: string): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const ratings = await this.prisma.rating.findMany({
      where: { doctorId, createdAt: { gte: ninetyDaysAgo } },
      select: { stars: true },
    });

    const totalRatings = ratings.length;
    const qualityScore =
      totalRatings >= 5
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / totalRatings
        : null;

    await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { qualityScore, totalRatings },
    });
  }

  async computeBadges(doctorId: string): Promise<string[]> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        qualityScore: true,
        totalRatings: true,
        yearsOfExperience: true,
        languages: true,
        consultations: {
          where: {
            status: "COMPLETED",
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        },
      },
    });

    if (!doctor) return [];

    const totalConsultations = await this.prisma.consultation.count({
      where: { doctorId, status: "COMPLETED" },
    });

    const badges: string[] = [];

    if (totalConsultations >= 100 && (doctor.qualityScore ?? 0) >= 4.5) {
      badges.push(BADGE_LABELS.PREMIUM);
    }

    if ((doctor.yearsOfExperience ?? 0) >= 10) {
      badges.push(BADGE_LABELS.EXPERIENCED);
    }

    if (totalConsultations >= 500) {
      badges.push(BADGE_LABELS.VETERAN);
    }

    if (
      doctor.languages.includes("Arabe") &&
      doctor.languages.includes("Français")
    ) {
      badges.push(BADGE_LABELS.BILINGUAL);
    }

    // Réactif : 20+ consultations en 30 jours (proxy pour réactivité)
    if (doctor.consultations.length >= 20 && (doctor.qualityScore ?? 0) >= 4.0) {
      badges.push(BADGE_LABELS.REACTIVE);
    }

    return badges;
  }

  async getDoctorStats(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { qualityScore: true, totalRatings: true },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentRatings, prevRatings] = await Promise.all([
      this.prisma.rating.findMany({
        where: { doctorId, createdAt: { gte: thirtyDaysAgo } },
        select: { stars: true },
      }),
      this.prisma.rating.findMany({
        where: {
          doctorId,
          createdAt: {
            gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
            lt: thirtyDaysAgo,
          },
        },
        select: { stars: true },
      }),
    ]);

    const recentAvg =
      recentRatings.length > 0
        ? recentRatings.reduce((s, r) => s + r.stars, 0) / recentRatings.length
        : null;
    const prevAvg =
      prevRatings.length > 0
        ? prevRatings.reduce((s, r) => s + r.stars, 0) / prevRatings.length
        : null;

    const trend =
      recentAvg !== null && prevAvg !== null
        ? Math.round((recentAvg - prevAvg) * 10) / 10
        : null;

    const badges = await this.computeBadges(doctorId);

    return {
      qualityScore: doctor?.qualityScore ?? null,
      totalRatings: doctor?.totalRatings ?? 0,
      trend,
      badges,
    };
  }
}
