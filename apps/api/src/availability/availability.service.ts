// ============================================================
// Fuseau horaire : Africa/Casablanca (UTC+1 fixe, pas de DST)
//
// Règle de stockage :
//   - AvailabilitySlot.startTime/endTime  → strings "HH:mm" en heure LOCALE Casablanca
//   - AvailabilityException.startsAt/endsAt → UTC en base de données (Prisma DateTime)
//   - Doctor.manualOverrideUntil          → UTC en base de données
//
// Pour comparer "now" avec un créneau :
//   1. toZonedTime(now, TZ) → obtient l'heure locale Casablanca
//   2. extraire dayOfWeek et "HH:mm" de cette heure locale
//   3. comparer avec les strings stockées
// ============================================================

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { toZonedTime } from "date-fns-tz";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { CreateSlotDto } from "./dto/create-slot.dto";
import { UpdateSlotDto } from "./dto/update-slot.dto";
import { CreateExceptionDto } from "./dto/create-exception.dto";
import { SetOverrideDto } from "./dto/set-override.dto";

const TZ = "Africa/Casablanca";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function localHHMM(zonedDate: Date): string {
  const h = String(zonedDate.getHours()).padStart(2, "0");
  const m = String(zonedDate.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  // ── Créneaux récurrents ────────────────────────────────────

  async getSlots(doctorId: string) {
    return this.prisma.availabilitySlot.findMany({
      where: { doctorId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async createSlot(doctorId: string, dto: CreateSlotDto) {
    this.validateSlotTimes(dto.startTime, dto.endTime);
    await this.checkSlotOverlap(doctorId, dto.dayOfWeek, dto.startTime, dto.endTime);

    return this.prisma.availabilitySlot.create({
      data: { doctorId, dayOfWeek: dto.dayOfWeek, startTime: dto.startTime, endTime: dto.endTime },
    });
  }

  async updateSlot(slotId: string, doctorId: string, dto: UpdateSlotDto) {
    const slot = await this.prisma.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException("Créneau introuvable");
    if (slot.doctorId !== doctorId) throw new ForbiddenException();

    const newStart = dto.startTime ?? slot.startTime;
    const newEnd = dto.endTime ?? slot.endTime;
    this.validateSlotTimes(newStart, newEnd);
    await this.checkSlotOverlap(doctorId, slot.dayOfWeek, newStart, newEnd, slotId);

    return this.prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { startTime: newStart, endTime: newEnd },
    });
  }

  async deleteSlot(slotId: string, doctorId: string) {
    const slot = await this.prisma.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException("Créneau introuvable");
    if (slot.doctorId !== doctorId) throw new ForbiddenException();
    await this.prisma.availabilitySlot.delete({ where: { id: slotId } });
  }

  // ── Exceptions ponctuelles ─────────────────────────────────

  async getExceptions(doctorId: string, from?: string, to?: string) {
    const where: Record<string, unknown> = { doctorId };
    if (from || to) {
      where.startsAt = {};
      if (from) (where.startsAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.startsAt as Record<string, unknown>).lte = new Date(to);
    }
    return this.prisma.availabilityException.findMany({
      where,
      orderBy: { startsAt: "asc" },
    });
  }

  async createException(doctorId: string, dto: CreateExceptionDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const now = new Date();

    if (endsAt <= startsAt) {
      throw new BadRequestException("endsAt doit être après startsAt");
    }
    if (endsAt <= now) {
      throw new BadRequestException("L'exception ne peut pas être dans le passé");
    }

    return this.prisma.availabilityException.create({
      data: { doctorId, startsAt, endsAt, type: dto.type, reason: dto.reason },
    });
  }

  async deleteException(exceptionId: string, doctorId: string) {
    const exc = await this.prisma.availabilityException.findUnique({ where: { id: exceptionId } });
    if (!exc) throw new NotFoundException("Exception introuvable");
    if (exc.doctorId !== doctorId) throw new ForbiddenException();
    await this.prisma.availabilityException.delete({ where: { id: exceptionId } });
  }

  // ── Override manuel ────────────────────────────────────────

  async setOverride(doctorId: string, dto: SetOverrideDto): Promise<void> {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    const manualOverrideUntil = dto.durationMinutes
      ? new Date(Date.now() + dto.durationMinutes * 60 * 1000)
      : null;

    // Si on force indisponible et qu'un patient est MATCHED → requeue
    if (!dto.isAvailable) {
      const matched = await this.prisma.consultation.findFirst({
        where: { doctorId, status: "MATCHED" },
      });
      if (matched) await this.queueService.requeue(matched.id);
    }

    await this.prisma.doctor.update({
      where: { id: doctorId },
      data: {
        isAvailable: dto.isAvailable,
        manualOverride: dto.isAvailable,
        manualOverrideUntil,
      },
    });

    // Si on force disponible → tenter un match
    if (dto.isAvailable) {
      await this.queueService.tryMatch(doctorId);
    }
  }

  async clearOverride(doctorId: string): Promise<void> {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { manualOverride: null, manualOverrideUntil: null },
    });

    // Recalcule et applique immédiatement selon le calendrier
    const expected = await this.isScheduleAvailable(doctorId, new Date());
    await this.applyAvailability(doctorId, expected, doctor.isAvailable);
  }

  // ── Vue calculée ───────────────────────────────────────────

  async getComputedSlots(doctorId: string, date: string): Promise<Array<{ startsAt: string; endsAt: string }>> {
    const day = new Date(date);
    // dayOfWeek en heure Casablanca pour la date donnée
    const zonedDay = toZonedTime(new Date(date + "T12:00:00Z"), TZ);
    const dow = zonedDay.getDay();

    const [slots, exceptions] = await Promise.all([
      this.prisma.availabilitySlot.findMany({ where: { doctorId, dayOfWeek: dow } }),
      this.prisma.availabilityException.findMany({
        where: {
          doctorId,
          startsAt: { lte: new Date(date + "T23:59:59Z") },
          endsAt: { gte: new Date(date + "T00:00:00Z") },
        },
      }),
    ]);

    const results: Array<{ startsAt: string; endsAt: string }> = [];

    for (const slot of slots) {
      const slotStart = new Date(`${date}T${slot.startTime}:00`);
      const slotEnd = new Date(`${date}T${slot.endTime}:00`);

      // Découpe le créneau autour des exceptions BLOCKED
      const blocked = exceptions.filter((e) => e.type === "BLOCKED");
      let segments: Array<[Date, Date]> = [[slotStart, slotEnd]];

      for (const b of blocked) {
        segments = segments.flatMap(([s, e]) => {
          if (b.endsAt <= s || b.startsAt >= e) return [[s, e]];
          const parts: Array<[Date, Date]> = [];
          if (b.startsAt > s) parts.push([s, b.startsAt]);
          if (b.endsAt < e) parts.push([b.endsAt, e]);
          return parts;
        });
      }

      for (const [s, e] of segments) {
        if (e > s) {
          results.push({ startsAt: s.toISOString(), endsAt: e.toISOString() });
        }
      }
    }

    // Ajoute les EXTRA_AVAILABILITY
    for (const exc of exceptions.filter((e) => e.type === "EXTRA_AVAILABILITY")) {
      results.push({ startsAt: exc.startsAt.toISOString(), endsAt: exc.endsAt.toISOString() });
    }

    return results.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  // ── Logique interne (utilisée par le scheduler) ────────────

  /**
   * Calcule si le docteur devrait être disponible à `at` selon son calendrier.
   * Ignoré si manualOverride est actif — cette vérification est faite dans le scheduler.
   */
  async isScheduleAvailable(doctorId: string, at: Date): Promise<boolean> {
    const zoned = toZonedTime(at, TZ);
    const dow = zoned.getDay();
    const hhmm = localHHMM(zoned);
    const atMinutes = toMinutes(hhmm);

    const [slots, exceptions] = await Promise.all([
      this.prisma.availabilitySlot.findMany({ where: { doctorId, dayOfWeek: dow } }),
      this.prisma.availabilityException.findMany({
        where: {
          doctorId,
          startsAt: { lte: at },
          endsAt: { gt: at },
        },
      }),
    ]);

    // EXTRA_AVAILABILITY active → disponible quoi qu'il arrive
    if (exceptions.some((e) => e.type === "EXTRA_AVAILABILITY")) return true;

    // BLOCKED active → indisponible quoi qu'il arrive
    if (exceptions.some((e) => e.type === "BLOCKED")) return false;

    // Vérifie si un créneau récurrent couvre l'heure actuelle
    return slots.some((s) => {
      const start = toMinutes(s.startTime);
      const end = toMinutes(s.endTime);
      return atMinutes >= start && atMinutes < end;
    });
  }

  /**
   * Met à jour isAvailable si la valeur change, et requeue le patient MATCHED si on passe à false.
   */
  async applyAvailability(doctorId: string, expected: boolean, current: boolean): Promise<void> {
    if (expected === current) return;

    if (!expected) {
      const matched = await this.prisma.consultation.findFirst({
        where: { doctorId, status: "MATCHED" },
      });
      if (matched) await this.queueService.requeue(matched.id);
    }

    await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { isAvailable: expected },
    });

    if (expected) {
      await this.queueService.tryMatch(doctorId);
    }
  }

  // ── Helpers privés ─────────────────────────────────────────

  private validateSlotTimes(startTime: string, endTime: string): void {
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      throw new BadRequestException("endTime doit être strictement après startTime");
    }
  }

  private async checkSlotOverlap(
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.availabilitySlot.findMany({
      where: { doctorId, dayOfWeek, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    for (const slot of existing) {
      const s = toMinutes(slot.startTime);
      const e = toMinutes(slot.endTime);
      if (newStart < e && newEnd > s) {
        throw new BadRequestException(
          `Ce créneau chevauche un créneau existant (${slot.startTime}–${slot.endTime})`,
        );
      }
    }
  }
}
