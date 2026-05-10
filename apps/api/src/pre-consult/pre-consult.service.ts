import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { PreConsultDto } from "./dto/pre-consult.dto";
import type { PreConsultData } from "@medapp/shared-types";

@Injectable()
export class PreConsultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async submitPreConsult(
    consultationId: string,
    userId: string,
    dto: PreConsultDto,
  ) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();

    if (consultation.status !== "WAITING_PRE_CONSULT") {
      throw new BadRequestException(
        "La pré-consultation n'est pas disponible pour cette consultation",
      );
    }

    // Snapshot du profil santé au moment de la pré-consult
    const data: PreConsultData = {
      mainSymptom: dto.mainSymptom,
      isCustomSymptom: dto.isCustomSymptom,
      duration: dto.duration ?? "less24h",
      painLevel: dto.painLevel ?? null,
      additionalInfo: dto.additionalInfo ?? "",
      urgentNote: dto.urgentNote,
      allergiesSnapshot: patient.allergies,
      medicationsSnapshot: patient.medications,
      conditionsSnapshot: patient.conditions,
    };

    const updated = await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        preConsultData: data as object,
        preConsultMode: dto.mode,
        preConsultFilledAt: new Date(),
        status: "IN_QUEUE",
        queuedAt: new Date(),
      },
      select: { id: true, status: true, preConsultMode: true },
    });

    await this.queue.enqueue(consultationId);

    return updated;
  }

  async getBrief(consultationId: string, doctorUserId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { patient: true },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.doctorId !== doctor.id) throw new ForbiddenException();

    const p = consultation.patient;
    const ageMs = Date.now() - p.dateOfBirth.getTime();
    const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));

    return {
      patient: {
        firstName: p.firstName,
        lastName: `${p.lastName[0]}.`,
        age,
        sex: p.sex,
      },
      preConsultData: consultation.preConsultData as PreConsultData | null,
      preConsultMode: consultation.preConsultMode,
      preConsultFilledAt: consultation.preConsultFilledAt?.toISOString() ?? null,
      isUrgent: consultation.preConsultMode === "URGENT",
    };
  }

  async getPatientBrief(consultationId: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();

    return {
      preConsultData: consultation.preConsultData as PreConsultData | null,
      preConsultMode: consultation.preConsultMode,
      preConsultFilledAt: consultation.preConsultFilledAt?.toISOString() ?? null,
    };
  }
}
