import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { hashIp } from "../common/audit/hash-ip.util";

@Injectable()
export class SharedFileAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getPatientHistory(consultationId: string, doctorUserId: string, ip: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorUserId },
    });
    if (!doctor) throw new ForbiddenException("Médecin introuvable");

    const consult = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consult || consult.doctorId !== doctor.id) {
      throw new ForbiddenException("Médecin non assigné à cette consultation");
    }
    if (!["MATCHED", "IN_PROGRESS"].includes(consult.status)) {
      throw new ForbiddenException("Consultation non active");
    }

    const consent = await this.prisma.sharingConsent.findUnique({
      where: { patientId: consult.patientId },
    });

    if (!consent?.isEnabled) {
      return { hasConsent: false, history: [] };
    }

    const sharedConsults = await this.prisma.consultation.findMany({
      where: {
        patientId: consult.patientId,
        status: "COMPLETED",
        excludedFromSharing: false,
        id: { not: consultationId },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        doctor: { select: { firstName: true, speciality: true } },
      },
    });

    // Log the access (fire-and-forget — never block the response)
    this.prisma.patientFileAccessLog
      .create({
        data: {
          patientId: consult.patientId,
          doctorId: doctor.id,
          consultationId,
          accessType: "VIEW_HISTORY",
          ipHash: hashIp(ip),
        },
      })
      .catch(() => {});

    return {
      hasConsent: true,
      history: sharedConsults.map((c) => {
        const pc = c.preConsultData as {
          mainSymptom?: string;
        } | null;
        return {
          id: c.id,
          date: c.startedAt?.toISOString() ?? c.createdAt.toISOString(),
          doctorName: c.doctor ? `Dr. ${c.doctor.firstName}` : "Médecin inconnu",
          doctorSpeciality: c.doctor?.speciality ?? null,
          mainSymptom: pc?.mainSymptom ?? null,
          diagnosis: c.diagnosis,
          prescription: c.prescription,
        };
      }),
    };
  }
}
