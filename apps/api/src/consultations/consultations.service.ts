import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from "../payments/payment-provider.interface";
import { QueueService } from "../queue/queue.service";
import { VideoService } from "../video/video.service";
import { CreateConsultationDto } from "./dto/create-consultation.dto";
import type { Consultation } from "@medapp/shared-types";

const STANDARD_FEE = 150;

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly queueService: QueueService,
    private readonly config: ConfigService,
    private readonly videoService: VideoService,
  ) {}

  async getActive(userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) return null;

    return this.prisma.consultation.findFirst({
      where: {
        patientId: patient.id,
        status: { in: ["WAITING_PAYMENT", "IN_QUEUE", "MATCHED", "IN_PROGRESS"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, reason: true, amount: true, createdAt: true },
    });
  }

  async getIncomplete(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    return this.prisma.consultation.findMany({
      where: {
        doctorId: doctor.id,
        status: "COMPLETED",
        autoClosedByTimeout: true,
        diagnosis: null,
      },
      orderBy: { endedAt: "desc" },
      select: {
        id: true,
        endedAt: true,
        startedAt: true,
        reason: true,
        amount: true,
        patient: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async create(userId: string, dto: CreateConsultationDto): Promise<Consultation> {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const active = await this.prisma.consultation.findFirst({
      where: {
        patientId: patient.id,
        status: { in: ["WAITING_PAYMENT", "IN_QUEUE", "MATCHED", "IN_PROGRESS"] },
      },
      select: { id: true },
    });
    if (active) {
      throw new ConflictException({
        message: "Vous avez déjà une consultation en cours",
        existingConsultationId: active.id,
      });
    }

    const consultation = await this.prisma.consultation.create({
      data: {
        patientId: patient.id,
        status: "WAITING_PAYMENT",
        amount: STANDARD_FEE,
        reason: dto.reason,
      },
    });

    const { paymentRef } = await this.paymentProvider.initiate(
      consultation.id,
      STANDARD_FEE,
    );

    const updated = await this.prisma.consultation.update({
      where: { id: consultation.id },
      data: { paymentRef },
    });

    return this.toDto(updated);
  }

  async findMine(userId: string): Promise<Consultation[]> {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const consultations = await this.prisma.consultation.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return consultations.map((c) => this.toDto(c));
  }

  async findOne(consultationId: string, userId: string): Promise<Consultation> {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();

    return this.toDto(consultation);
  }

  async getQueueStatus(consultationId: string, userId: string) {
    const consultation = await this.findOne(consultationId, userId);

    const { position, totalInQueue } = await this.queueService.getPosition(consultationId);
    const avgMin = this.config.get<number>("AVG_CONSULTATION_MINUTES", 4);
    const timeoutMin = this.config.get<number>("QUEUE_TIMEOUT_MINUTES", 15);

    const timeRemainingSeconds = consultation.queuedAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(consultation.queuedAt).getTime() +
              timeoutMin * 60 * 1000 -
              Date.now()) /
              1000,
          ),
        )
      : 0;

    return {
      consultationId: consultation.id,
      status: consultation.status,
      position,
      totalInQueue,
      estimatedWaitMinutes: position * avgMin,
      timeRemainingSeconds,
      queuedAt: consultation.queuedAt,
    };
  }

  async cancel(consultationId: string, userId: string): Promise<Consultation> {
    const consultation = await this.findOne(consultationId, userId);

    if (!["WAITING_PAYMENT", "IN_QUEUE"].includes(consultation.status)) {
      throw new BadRequestException(
        "La consultation ne peut pas être annulée dans cet état",
      );
    }

    if (consultation.status === "IN_QUEUE") {
      await this.queueService.removeFromQueue(consultationId);
    }

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: { status: "CANCELLED" },
    });

    if (consultation.paymentStatus === "SUCCEEDED" && consultation.paymentRef) {
      await this.paymentProvider.refund(consultation.paymentRef);
      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: { paymentStatus: "REFUNDED" },
      });
    }

    const updated = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    return this.toDto(updated!);
  }

  async getVideoToken(
    consultationId: string,
    userId: string,
  ): Promise<{ token: string; roomUrl: string }> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { patient: true, doctor: true },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");

    if (!consultation.videoRoomId || !consultation.videoRoomUrl) {
      throw new BadRequestException("La room vidéo n'est pas encore prête");
    }

    const isPatient = consultation.patient.userId === userId;
    const isDoctor = consultation.doctor?.userId === userId;
    if (!isPatient && !isDoctor) throw new ForbiddenException();

    const userName = isPatient
      ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
      : `Dr. ${consultation.doctor!.firstName} ${consultation.doctor!.lastName}`;

    const token = await this.videoService.generateAccessToken(
      consultation.videoRoomId,
      userName,
      isDoctor,
    );

    return { token, roomUrl: consultation.videoRoomUrl };
  }

  async getSummary(consultationId: string, userId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { patient: true, doctor: true },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");

    const isPatient = consultation.patient.userId === userId;
    const isDoctor = consultation.doctor?.userId === userId;
    if (!isPatient && !isDoctor) throw new ForbiddenException();

    const duration =
      consultation.startedAt && consultation.endedAt
        ? Math.round(
            (consultation.endedAt.getTime() - consultation.startedAt.getTime()) / 60000,
          )
        : null;

    return {
      id: consultation.id,
      reason: consultation.reason,
      diagnosis: consultation.diagnosis,
      prescription: consultation.prescription,
      status: consultation.status,
      amount: Number(consultation.amount),
      durationMinutes: duration,
      createdAt: consultation.createdAt.toISOString(),
      startedAt: consultation.startedAt?.toISOString() ?? null,
      endedAt: consultation.endedAt?.toISOString() ?? null,
      patient: {
        firstName: consultation.patient.firstName,
        lastName: consultation.patient.lastName,
      },
      doctor: consultation.doctor
        ? {
            firstName: consultation.doctor.firstName,
            lastName: consultation.doctor.lastName,
            speciality: consultation.doctor.speciality,
          }
        : null,
    };
  }

  private toDto(c: {
    id: string;
    patientId: string;
    doctorId: string | null;
    status: string;
    amount: unknown;
    paymentStatus: string;
    paymentRef: string | null;
    reason: string | null;
    diagnosis: string | null;
    prescription: string | null;
    videoRoomUrl: string | null;
    queuedAt: Date | null;
    startedAt: Date | null;
    endedAt: Date | null;
    createdAt: Date;
  }): Consultation {
    return {
      id: c.id,
      patientId: c.patientId,
      ...(c.doctorId && { doctorId: c.doctorId }),
      status: c.status as Consultation["status"],
      amount: Number(c.amount),
      paymentStatus: c.paymentStatus as Consultation["paymentStatus"],
      ...(c.paymentRef && { paymentRef: c.paymentRef }),
      ...(c.reason && { reason: c.reason }),
      ...(c.diagnosis && { diagnosis: c.diagnosis }),
      ...(c.prescription && { prescription: c.prescription }),
      ...(c.videoRoomUrl && { videoRoomUrl: c.videoRoomUrl }),
      ...(c.queuedAt && { queuedAt: c.queuedAt.toISOString() }),
      ...(c.startedAt && { startedAt: c.startedAt.toISOString() }),
      ...(c.endedAt && { endedAt: c.endedAt.toISOString() }),
      createdAt: c.createdAt.toISOString(),
    };
  }
}
