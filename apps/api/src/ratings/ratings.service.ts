import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { QualityScoreService } from "../quality/quality-score.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quality: QualityScoreService,
  ) {}

  async createRating(
    consultationId: string,
    userId: string,
    dto: CreateRatingDto,
  ) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { rating: true },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();
    if (consultation.status !== "COMPLETED") {
      throw new ConflictException("La consultation n'est pas terminée");
    }
    if (consultation.rating) {
      throw new ConflictException("Cette consultation a déjà été notée");
    }

    if (!consultation.doctorId) {
      throw new NotFoundException("Médecin introuvable");
    }

    const rating = await this.prisma.rating.create({
      data: {
        consultationId,
        doctorId: consultation.doctorId,
        patientId: patient.id,
        stars: dto.stars,
        feedback: dto.feedback,
        tags: dto.tags ?? [],
      },
    });

    // Recalculate quality score asynchronously
    this.quality.recalculate(consultation.doctorId).catch(() => {});

    return { success: true, id: rating.id, doctorId: consultation.doctorId };
  }

  async getConsultationRating(consultationId: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) return null;

    const rating = await this.prisma.rating.findUnique({
      where: { consultationId },
    });
    if (!rating || rating.patientId !== patient.id) return null;

    return {
      id: rating.id,
      stars: rating.stars,
      feedback: rating.feedback,
      tags: rating.tags,
    };
  }

  async getDoctorFeedback(userId: string, page = 1, limit = 20) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { doctorId: doctor.id, feedback: { not: null } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          stars: true,
          feedback: true,
          tags: true,
          createdAt: true,
        },
      }),
      this.prisma.rating.count({
        where: { doctorId: doctor.id, feedback: { not: null } },
      }),
    ]);

    return { items, total, page, limit };
  }
}
