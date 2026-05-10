import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { VideoService } from "../video/video.service";
import { AvailabilityService } from "../availability/availability.service";
import { ConsultationsService } from "../consultations/consultations.service";
import { InvoicesService } from "../invoices/invoices.service";
import { EndConsultationDto } from "../consultations/dto/end-consultation.dto";
import type { DoctorProfile } from "@medapp/shared-types";

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly videoService: VideoService,
    private readonly availabilityService: AvailabilityService,
    private readonly consultationsService: ConsultationsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async getMe(userId: string): Promise<DoctorProfile> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      include: { user: { select: { email: true, phone: true } } },
    });

    if (!doctor) throw new NotFoundException("Profil médecin introuvable");

    return {
      id: doctor.id,
      userId: doctor.userId,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.user.email,
      phone: doctor.user.phone,
      cin: doctor.cin,
      ordreNumber: doctor.ordreNumber,
      speciality: doctor.speciality,
      status: doctor.status,
      isAvailable: doctor.isAvailable,
      consultationFee: Number(doctor.consultationFee),
      createdAt: doctor.createdAt.toISOString(),
      manualOverride: doctor.manualOverride,
      manualOverrideUntil: doctor.manualOverrideUntil?.toISOString() ?? null,
    };
  }

  async updateAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<{
    isAvailable: boolean;
    matchedConsultation?: {
      id: string;
      patientId: string;
      reason: string | null;
      status: string;
    } | null;
  }> {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Profil médecin introuvable");

    // Délègue au système d'override (override permanent, sans durée)
    await this.availabilityService.setOverride(doctor.id, { isAvailable });

    if (!isAvailable) return { isAvailable: false };

    // tryMatch déjà appelé par setOverride, on relit juste le résultat MATCHED
    const matchedConsultation = await this.prisma.consultation.findFirst({
      where: { doctorId: doctor.id, status: "MATCHED" },
      select: { id: true, patientId: true, reason: true, status: true },
    });
    return { isAvailable: true, matchedConsultation };
  }

  async getPendingConsultation(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Profil médecin introuvable");

    const consultation = await this.prisma.consultation.findFirst({
      where: { doctorId: doctor.id, status: "MATCHED" },
      select: {
        id: true,
        reason: true,
        status: true,
        amount: true,
        matchedAt: true,
        preConsultData: true,
        preConsultMode: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            sex: true,
          },
        },
      },
    });

    if (!consultation) return null;

    const ageMs = Date.now() - consultation.patient.dateOfBirth.getTime();
    const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));

    return {
      id: consultation.id,
      reason: consultation.reason,
      status: consultation.status,
      amount: Number(consultation.amount),
      matchedAt: consultation.matchedAt?.toISOString(),
      preConsultData: consultation.preConsultData,
      preConsultMode: consultation.preConsultMode,
      isUrgent: consultation.preConsultMode === "URGENT",
      patient: {
        firstName: consultation.patient.firstName,
        lastName: consultation.patient.lastName,
        age,
        sex: consultation.patient.sex,
      },
    };
  }

  async startConsultation(consultationId: string, userId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Profil médecin introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.doctorId !== doctor.id) throw new ForbiddenException();
    if (consultation.status !== "MATCHED") {
      throw new BadRequestException("La consultation n'est pas en statut MATCHED");
    }

    const { roomId, roomUrl } = await this.videoService.createRoom(consultationId);

    return this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
        videoRoomId: roomId,
        videoRoomUrl: roomUrl,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        videoRoomId: true,
        videoRoomUrl: true,
      },
    });
  }

  async getIncompleteConsultations(userId: string) {
    return this.consultationsService.getIncomplete(userId);
  }

  async endConsultation(
    consultationId: string,
    userId: string,
    dto: EndConsultationDto,
  ) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Profil médecin introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.doctorId !== doctor.id) throw new ForbiddenException();
    if (consultation.status !== "IN_PROGRESS") {
      throw new BadRequestException("La consultation n'est pas en cours");
    }

    const updated = await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        diagnosis: dto.diagnosis,
        prescription: dto.prescription,
        status: "COMPLETED",
        endedAt: new Date(),
      },
      select: { id: true, status: true, endedAt: true },
    });

    if (consultation.videoRoomId) {
      try {
        await this.videoService.destroyRoom(consultation.videoRoomId);
      } catch (err) {
        this.logger.error(
          `destroyRoom failed for ${consultation.videoRoomId}: ${err}`,
        );
      }
    }

    // Tenter de matcher le prochain patient en file immédiatement
    try {
      await this.queueService.tryMatch(doctor.id);
    } catch (err) {
      this.logger.warn(`tryMatch after endConsultation failed: ${err}`);
    }

    // Générer le reçu patient (fire-and-forget)
    this.invoicesService.createPaymentReceipt(consultationId).catch((err) =>
      this.logger.error(`createPaymentReceipt failed: ${err}`),
    );

    return updated;
  }

  async getPublicProfile(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId, status: "VERIFIED" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        speciality: true,
        bio: true,
        yearsOfExperience: true,
        languages: true,
        profilePhotoUrl: true,
        qualityScore: true,
        totalRatings: true,
        verifiedAt: true,
      },
    });

    if (!doctor) throw new NotFoundException("Médecin introuvable");

    return {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: `${doctor.lastName[0]}.`,
      speciality: doctor.speciality,
      bio: doctor.bio,
      yearsOfExperience: doctor.yearsOfExperience,
      languages: doctor.languages,
      profilePhotoUrl: doctor.profilePhotoUrl,
      qualityScore: doctor.qualityScore,
      totalRatings: doctor.totalRatings,
      verifiedAt: doctor.verifiedAt?.toISOString() ?? null,
    };
  }

  async getReferringPatientsCount(userId: string): Promise<{ count: number }> {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return { count: 0 };
    const count = await this.prisma.patient.count({
      where: { referringDoctorId: doctor.id },
    });
    return { count };
  }

  async getNextAvailabilityForDoctor(doctorId: string) {
    return this.queueService.getNextAvailabilityForDoctor(doctorId);
  }

  async getMyQualityStats(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentRatings, prevRatings] = await Promise.all([
      this.prisma.rating.findMany({
        where: { doctorId: doctor.id, createdAt: { gte: thirtyDaysAgo } },
        select: { stars: true },
      }),
      this.prisma.rating.findMany({
        where: {
          doctorId: doctor.id,
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

    return {
      qualityScore: doctor.qualityScore,
      totalRatings: doctor.totalRatings,
      trend,
    };
  }
}
