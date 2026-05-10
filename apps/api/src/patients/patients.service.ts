import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import * as path from "path";
import * as fs from "fs";
import { UpdatePatientProfileDto } from "./dto/update-profile.dto";
import { UpdateHealthProfileDto } from "./dto/update-health.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Helper ────────────────────────────────────────────────────────────────

  private async findPatient(userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Profil patient introuvable");
    return patient;
  }

  // ── Dashboard summary ─────────────────────────────────────────────────────

  async getDashboardSummary(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        consultations: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            doctor: { select: { firstName: true, lastName: true, speciality: true } },
          },
        },
      },
    });
    if (!patient) throw new NotFoundException("Profil patient introuvable");

    const [activeConsultation, doctorsAvailable, queueLength] =
      await Promise.all([
        this.prisma.consultation.findFirst({
          where: {
            patientId: patient.id,
            status: { in: ["WAITING_PAYMENT", "WAITING_PRE_CONSULT", "IN_QUEUE", "MATCHED", "IN_PROGRESS"] },
          },
          select: { id: true, status: true },
        }),
        this.prisma.doctor.count({ where: { status: "VERIFIED", isAvailable: true } }),
        this.prisma.consultation.count({ where: { status: "IN_QUEUE" } }),
      ]);

    const avgMin = this.config.get<number>("AVG_CONSULTATION_MINUTES", 8);
    const avgWaitMinutes =
      doctorsAvailable > 0
        ? Math.max(1, Math.ceil((queueLength * avgMin) / doctorsAvailable))
        : queueLength > 0
          ? queueLength * avgMin
          : 0;

    return {
      user: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        photoUrl: patient.photoUrl,
      },
      activeConsultation,
      recentConsultations: patient.consultations.map((c) => ({
        id: c.id,
        status: c.status,
        reason: c.reason,
        amount: Number(c.amount),
        createdAt: c.createdAt.toISOString(),
        doctor: c.doctor
          ? {
              firstName: c.doctor.firstName,
              lastName: c.doctor.lastName,
              speciality: c.doctor.speciality,
            }
          : null,
      })),
      healthProfile: {
        allergies: patient.allergies,
        conditions: patient.conditions,
        medications: patient.medications,
      },
      liveStats: { doctorsAvailable, avgWaitMinutes },
    };
  }

  // ── Consultations list (paginé + filtres) ─────────────────────────────────

  async getConsultations(
    userId: string,
    opts: {
      status?: string;
      from?: string;
      to?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const patient = await this.findPatient(userId);

    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(50, opts.limit ?? 10);
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { patientId: patient.id };

    if (opts.status && opts.status !== "ALL") {
      where.status = opts.status;
    }
    if (opts.from) {
      where.createdAt = { ...where.createdAt, gte: new Date(opts.from) };
    }
    if (opts.to) {
      where.createdAt = { ...where.createdAt, lte: new Date(opts.to) };
    }
    if (opts.search?.trim()) {
      where.doctor = {
        OR: [
          { firstName: { contains: opts.search.trim(), mode: "insensitive" } },
          { lastName: { contains: opts.search.trim(), mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          doctor: { select: { firstName: true, lastName: true, speciality: true } },
        },
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        status: c.status,
        reason: c.reason,
        diagnosis: c.diagnosis,
        amount: Number(c.amount),
        createdAt: c.createdAt.toISOString(),
        endedAt: c.endedAt?.toISOString() ?? null,
        doctor: c.doctor
          ? {
              firstName: c.doctor.firstName,
              lastName: c.doctor.lastName,
              speciality: c.doctor.speciality,
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  // ── Profil complet patient ────────────────────────────────────────────────

  async getMe(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!patient) throw new NotFoundException("Profil patient introuvable");

    return {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      cin: patient.cin,
      dateOfBirth: patient.dateOfBirth.toISOString(),
      sex: patient.sex,
      city: patient.city,
      photoUrl: patient.photoUrl,
      bloodType: patient.bloodType,
      heightCm: patient.heightCm,
      weightKg: patient.weightKg,
      allergies: patient.allergies,
      conditions: patient.conditions,
      medications: patient.medications,
      email: patient.user.email,
      phone: patient.user.phone,
    };
  }

  // ── Mise à jour identité ──────────────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdatePatientProfileDto) {
    const patient = await this.findPatient(userId);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), NOT: { id: patient.userId } },
      });
      if (existing) throw new ConflictException("Cet email est déjà utilisé");
    }
    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id: patient.userId } },
      });
      if (existing) throw new ConflictException("Ce numéro est déjà utilisé");
    }

    if (dto.email || dto.phone) {
      await this.prisma.user.update({
        where: { id: patient.userId },
        data: {
          ...(dto.email && { email: dto.email.toLowerCase() }),
          ...(dto.phone && { phone: dto.phone }),
        },
      });
    }

    await this.prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(dto.sex !== undefined && { sex: dto.sex as any }),
        ...(dto.city !== undefined && { city: dto.city }),
      },
    });

    return { success: true };
  }

  // ── Mise à jour profil santé ──────────────────────────────────────────────

  async updateHealthProfile(userId: string, dto: UpdateHealthProfileDto) {
    const patient = await this.findPatient(userId);

    await this.prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...(dto.allergies !== undefined && { allergies: dto.allergies }),
        ...(dto.conditions !== undefined && { conditions: dto.conditions }),
        ...(dto.medications !== undefined && { medications: dto.medications }),
        ...(dto.bloodType !== undefined && { bloodType: dto.bloodType }),
        ...(dto.heightCm !== undefined && { heightCm: dto.heightCm }),
        ...(dto.weightKg !== undefined && { weightKg: dto.weightKg }),
      },
    });

    return { success: true };
  }

  // ── Changement mot de passe ───────────────────────────────────────────────

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Mot de passe actuel incorrect");

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }

  // ── Upload photo ──────────────────────────────────────────────────────────

  async updatePhoto(userId: string, filename: string) {
    const patient = await this.findPatient(userId);
    const photoUrl = `/static/avatars/${filename}`;

    await this.prisma.patient.update({
      where: { id: patient.id },
      data: { photoUrl },
    });

    return { photoUrl };
  }

  // ── Vue patient pour le médecin ───────────────────────────────────────────

  async getPatientSummaryForDoctor(consultationId: string, doctorUserId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
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

    // Count previous completed consultations between this patient and this doctor
    const [prevConsultCount, lastConsult] = await Promise.all([
      this.prisma.consultation.count({
        where: {
          patientId: p.id,
          doctorId: doctor.id,
          status: "COMPLETED",
          id: { not: consultationId },
        },
      }),
      this.prisma.consultation.findFirst({
        where: {
          patientId: p.id,
          doctorId: doctor.id,
          status: "COMPLETED",
          id: { not: consultationId },
        },
        orderBy: { startedAt: "desc" },
        select: {
          startedAt: true,
          preConsultData: true,
        },
      }),
    ]);

    const lastConsultPc = lastConsult?.preConsultData as { mainSymptom?: string } | null;

    return {
      patient: {
        firstName: p.firstName,
        lastName: p.lastName,
        age,
        sex: p.sex,
        bloodType: p.bloodType,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        allergies: p.allergies,
        conditions: p.conditions,
        medications: p.medications,
      },
      consultation: { reason: consultation.reason },
      recurrence: {
        previousConsultationsCount: prevConsultCount,
        lastConsultationDate: lastConsult?.startedAt?.toISOString() ?? null,
        lastConsultationSymptom: lastConsultPc?.mainSymptom ?? null,
      },
    };
  }

  // ── Médecin référent — Brique 6.4 ────────────────────────────────────────

  async getReferringDoctor(userId: string) {
    const patient = await this.findPatient(userId);
    if (!patient.referringDoctorId) return { referringDoctor: null };

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: patient.referringDoctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        speciality: true,
        profilePhotoUrl: true,
        qualityScore: true,
        status: true,
      },
    });

    if (!doctor || doctor.status !== "VERIFIED") {
      return { referringDoctor: null };
    }

    return {
      referringDoctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        speciality: doctor.speciality,
        profilePhotoUrl: doctor.profilePhotoUrl,
        qualityScore: doctor.qualityScore,
        setAt: patient.referringSetAt?.toISOString() ?? null,
      },
    };
  }

  async setReferringDoctor(userId: string, doctorId: string) {
    const patient = await this.findPatient(userId);

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, status: true, firstName: true, lastName: true },
    });
    if (!doctor) throw new NotFoundException("Médecin introuvable");
    if (doctor.status !== "VERIFIED") {
      throw new BadRequestException("Ce médecin n'est pas vérifié sur la plateforme");
    }

    // Verify the patient has had at least one completed consultation with this doctor
    const hasConsulted = await this.prisma.consultation.findFirst({
      where: { patientId: patient.id, doctorId, status: "COMPLETED" },
      select: { id: true },
    });
    if (!hasConsulted) {
      throw new BadRequestException("Vous ne pouvez désigner comme référent qu'un médecin avec qui vous avez déjà consulté");
    }

    await this.prisma.patient.update({
      where: { id: patient.id },
      data: { referringDoctorId: doctorId, referringSetAt: new Date() },
    });

    return {
      referringDoctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
      },
    };
  }

  async removeReferringDoctor(userId: string) {
    const patient = await this.findPatient(userId);
    await this.prisma.patient.update({
      where: { id: patient.id },
      data: { referringDoctorId: null, referringSetAt: null },
    });
    return { success: true };
  }

  async getPastDoctors(userId: string) {
    const patient = await this.findPatient(userId);

    const consultations = await this.prisma.consultation.findMany({
      where: { patientId: patient.id, status: "COMPLETED", doctorId: { not: null } },
      orderBy: { startedAt: "desc" },
      distinct: ["doctorId"],
      take: 20,
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            speciality: true,
            profilePhotoUrl: true,
            qualityScore: true,
            status: true,
          },
        },
      },
    });

    return consultations
      .filter((c) => c.doctor?.status === "VERIFIED")
      .map((c) => ({
        id: c.doctor!.id,
        firstName: c.doctor!.firstName,
        lastName: c.doctor!.lastName,
        speciality: c.doctor!.speciality,
        profilePhotoUrl: c.doctor!.profilePhotoUrl,
        qualityScore: c.doctor!.qualityScore,
        lastConsultationDate: c.startedAt?.toISOString() ?? c.createdAt.toISOString(),
      }));
  }
}
