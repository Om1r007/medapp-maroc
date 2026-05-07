// ============================================================
// Scheduler de disponibilité — s'exécute toutes les minutes
// Fuseau horaire cible : Africa/Casablanca (UTC+1 fixe, sans DST)
//
// Logique pour chaque médecin VERIFIED :
//   1. Si manualOverride actif et non expiré → skip (l'override prime)
//   2. Si manualOverride expiré → clear, puis calcule
//   3. Calcule isScheduleAvailable(doctorId, now)
//   4. Si résultat ≠ isAvailable actuel → applique + requeue si nécessaire
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AvailabilityService } from "./availability.service";

@Injectable()
export class AvailabilitySchedulerService {
  private readonly logger = new Logger(AvailabilitySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly config: ConfigService,
  ) {}

  @Cron("0 * * * * *", { name: "availability-sync" })
  async syncAvailability(): Promise<void> {
    await this.runSync();
  }

  // Exposé pour le debug endpoint (NODE_ENV=development uniquement)
  async runSync(): Promise<{ processed: number; updated: number }> {
    const now = new Date();
    const doctors = await this.prisma.doctor.findMany({
      where: { status: "VERIFIED" },
      select: {
        id: true,
        isAvailable: true,
        manualOverride: true,
        manualOverrideUntil: true,
      },
    });

    let processed = 0;
    let updated = 0;

    for (const doctor of doctors) {
      try {
        processed++;

        // Override actif ?
        if (doctor.manualOverride !== null) {
          if (
            doctor.manualOverrideUntil === null ||
            doctor.manualOverrideUntil > now
          ) {
            // Override encore valide → ne rien toucher
            continue;
          }

          // Override expiré → clear
          await this.prisma.doctor.update({
            where: { id: doctor.id },
            data: { manualOverride: null, manualOverrideUntil: null },
          });
        }

        // Calcule la disponibilité attendue selon le calendrier
        const expected = await this.availability.isScheduleAvailable(doctor.id, now);

        // Applique si différent (inclut requeue si nécessaire)
        if (expected !== doctor.isAvailable) {
          await this.availability.applyAvailability(doctor.id, expected, doctor.isAvailable);
          updated++;
        }
      } catch (err) {
        this.logger.error(`Scheduler error for doctor ${doctor.id}: ${err}`);
      }
    }

    if (updated > 0) {
      this.logger.log(`Availability sync: ${updated}/${processed} doctors updated`);
    }

    return { processed, updated };
  }
}
