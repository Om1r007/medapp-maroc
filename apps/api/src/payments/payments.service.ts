import {
  BadRequestException,
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
} from "./payment-provider.interface";
import { QueueService } from "../queue/queue.service";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly queueService: QueueService,
  ) {}

  async simulateSuccess(consultationId: string, userId: string) {
    this.assertMockMode();
    const consultation = await this.getOwnedConsultation(consultationId, userId);

    if (consultation.paymentStatus === "SUCCEEDED") {
      throw new BadRequestException("Paiement déjà effectué");
    }

    const updated = await this.prisma.consultation.update({
      where: { id: consultationId },
      data: {
        paymentStatus: "SUCCEEDED",
        status: "WAITING_PRE_CONSULT",
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
      },
    });

    return updated;
  }

  async simulateFailure(consultationId: string, userId: string) {
    this.assertMockMode();
    const consultation = await this.getOwnedConsultation(consultationId, userId);

    if (consultation.paymentStatus === "SUCCEEDED") {
      throw new BadRequestException("Impossible d'échouer un paiement déjà réussi");
    }

    return this.prisma.consultation.update({
      where: { id: consultationId },
      data: { paymentStatus: "FAILED" },
      select: { id: true, status: true, paymentStatus: true },
    });
  }

  async getStatus(consultationId: string, userId: string) {
    const consultation = await this.getOwnedConsultation(consultationId, userId);
    return {
      consultationId: consultation.id,
      status: consultation.status,
      paymentStatus: consultation.paymentStatus,
    };
  }

  private assertMockMode() {
    if (this.config.get("PAYMENT_PROVIDER", "mock") !== "mock") {
      throw new NotFoundException("Endpoint disponible uniquement en mode mock");
    }
  }

  private async getOwnedConsultation(consultationId: string, userId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException("Consultation introuvable");
    if (consultation.patientId !== patient.id) throw new ForbiddenException();

    return consultation;
  }
}
