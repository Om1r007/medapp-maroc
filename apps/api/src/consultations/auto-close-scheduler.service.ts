// Fermeture automatique des consultations IN_PROGRESS bloquées
// Cron toutes les 5 min. Si startedAt < now - CONSULTATION_AUTO_CLOSE_HOURS,
// la consultation est marquée COMPLETED avec autoClosedByTimeout=true.
// La room Daily.co est détruite best-effort (ignore si déjà expirée / 404).

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { VideoService } from "../video/video.service";

@Injectable()
export class AutoCloseSchedulerService {
  private readonly logger = new Logger(AutoCloseSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoService,
    private readonly config: ConfigService,
  ) {}

  @Cron("0 */5 * * * *", { name: "consultation-auto-close" })
  async closeStaleConsultations(): Promise<void> {
    await this.run();
  }

  async run(): Promise<{ closed: number }> {
    const hours = this.config.get<number>("CONSULTATION_AUTO_CLOSE_HOURS", 1);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stale = await this.prisma.consultation.findMany({
      where: { status: "IN_PROGRESS", startedAt: { lt: cutoff } },
      select: { id: true, videoRoomId: true },
    });

    if (stale.length === 0) return { closed: 0 };

    this.logger.warn(
      `Auto-closing ${stale.length} consultation(s) sans fin explicite (> ${hours}h). Diagnostic manquant — médecin doit compléter rétrospectivement.`,
    );

    for (const c of stale) {
      await this.prisma.consultation.update({
        where: { id: c.id },
        data: {
          status: "COMPLETED",
          endedAt: new Date(),
          autoClosedByTimeout: true,
        },
      });

      if (c.videoRoomId) {
        try {
          await this.videoService.destroyRoom(c.videoRoomId);
        } catch {
          // Room déjà expirée ou supprimée — ignoré
        }
      }
    }

    return { closed: stale.length };
  }
}
