import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hashIp } from "../common/audit/hash-ip.util";

const CGU_VERSION = "2026-05-v1";

@Injectable()
export class SharingConsentService {
  constructor(private readonly prisma: PrismaService) {}

  private async getPatient(userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Profil patient introuvable");
    return patient;
  }

  async getConsent(userId: string) {
    const patient = await this.getPatient(userId);
    const consent = await this.prisma.sharingConsent.findUnique({
      where: { patientId: patient.id },
    });
    return {
      isEnabled: consent?.isEnabled ?? false,
      enabledAt: consent?.enabledAt?.toISOString() ?? null,
      disabledAt: consent?.disabledAt?.toISOString() ?? null,
      cguVersion: consent?.cguVersion ?? null,
    };
  }

  async enableConsent(userId: string, ip: string, userAgent: string | undefined) {
    const patient = await this.getPatient(userId);
    const ipHash = hashIp(ip);
    const now = new Date();

    const existing = await this.prisma.sharingConsent.findUnique({
      where: { patientId: patient.id },
    });

    if (existing) {
      await this.prisma.sharingConsent.update({
        where: { patientId: patient.id },
        data: {
          isEnabled: true,
          enabledAt: now,
          disabledAt: null,
          cguVersion: CGU_VERSION,
          ipAddressHash: ipHash,
          userAgent: userAgent ?? null,
          logs: {
            create: { action: "ENABLED", ipHash, timestamp: now },
          },
        },
      });
    } else {
      await this.prisma.sharingConsent.create({
        data: {
          patientId: patient.id,
          isEnabled: true,
          enabledAt: now,
          cguVersion: CGU_VERSION,
          ipAddressHash: ipHash,
          userAgent: userAgent ?? null,
          logs: {
            create: { action: "ENABLED", ipHash, timestamp: now },
          },
        },
      });
    }

    return { isEnabled: true };
  }

  async disableConsent(userId: string, ip: string) {
    const patient = await this.getPatient(userId);
    const ipHash = hashIp(ip);
    const now = new Date();

    const existing = await this.prisma.sharingConsent.findUnique({
      where: { patientId: patient.id },
    });
    if (!existing) return { isEnabled: false };

    await this.prisma.sharingConsent.update({
      where: { patientId: patient.id },
      data: {
        isEnabled: false,
        disabledAt: now,
        logs: {
          create: { action: "DISABLED", ipHash, timestamp: now },
        },
      },
    });

    return { isEnabled: false };
  }

  async getSharingHistory(userId: string) {
    const patient = await this.getPatient(userId);

    const logs = await this.prisma.patientFileAccessLog.findMany({
      where: { patientId: patient.id },
      orderBy: { accessedAt: "desc" },
      take: 50,
      include: {
        doctor: { select: { firstName: true, lastName: true, speciality: true } },
      },
    });

    return logs.map((l) => ({
      id: l.id,
      doctorName: `Dr. ${l.doctor.firstName} ${l.doctor.lastName[0]}.`,
      doctorSpeciality: l.doctor.speciality,
      accessType: l.accessType,
      accessedAt: l.accessedAt.toISOString(),
    }));
  }

  async excludeConsultation(
    consultationId: string,
    userId: string,
    reason?: string,
  ) {
    const patient = await this.getPatient(userId);

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        excludedFromSharing: true,
        excludedReason: reason ?? null,
        excludedAt: new Date(),
      },
    });

    return { excludedFromSharing: true };
  }

  async includeConsultation(consultationId: string, userId: string) {
    const patient = await this.getPatient(userId);

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        excludedFromSharing: false,
        excludedReason: null,
        excludedAt: null,
      },
    });

    return { excludedFromSharing: false };
  }

  async getExcludedConsultations(userId: string) {
    const patient = await this.getPatient(userId);

    const consultations = await this.prisma.consultation.findMany({
      where: { patientId: patient.id, excludedFromSharing: true },
      orderBy: { startedAt: "desc" },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    return consultations.map((c) => ({
      id: c.id,
      date: c.startedAt?.toISOString() ?? c.createdAt.toISOString(),
      doctorName: c.doctor
        ? `Dr. ${c.doctor.firstName} ${c.doctor.lastName}`
        : null,
      excludedReason: c.excludedReason,
      excludedAt: c.excludedAt?.toISOString() ?? null,
    }));
  }
}
