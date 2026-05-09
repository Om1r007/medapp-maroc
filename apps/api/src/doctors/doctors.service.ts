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
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    if (!consultation) return null;

    return {
      id: consultation.id,
      reason: consultation.reason,
      status: consultation.status,
      amount: Number(consultation.amount),
      matchedAt: consultation.matchedAt?.toISOString(),
      patient: consultation.patient,
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
}
