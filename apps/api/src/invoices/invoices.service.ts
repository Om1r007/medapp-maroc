import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InvoiceType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { PdfGeneratorService } from "./pdf-generator.service";
import { InvoiceNumberingService } from "./invoice-numbering.service";

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly storagePath: string;
  private readonly commissionPercent: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly numbering: InvoiceNumberingService,
    private readonly config: ConfigService,
  ) {
    this.storagePath = path.resolve(process.cwd(), "storage", "invoices");
    this.commissionPercent = config.get<number>("MEDAPP_COMMISSION_PERCENT", 20);
  }

  // ── Reçu patient (appelé après chaque consultation COMPLETED) ────────────

  async createPaymentReceipt(consultationId: string): Promise<void> {
    try {
      const existing = await this.prisma.invoice.findUnique({
        where: { consultationId },
      });
      if (existing) return; // idempotent

      const consultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { include: { user: { select: { id: true } } } },
        },
      });
      if (!consultation) return;

      const year = new Date().getFullYear();
      const number = await this.numbering.generateNumber(InvoiceType.PAYMENT_RECEIPT, year);
      const amount = Number(consultation.amount);
      const issuedAt = new Date();

      const pdfBuffer = await this.pdfGenerator.generatePaymentReceipt({
        number,
        issuedAt,
        patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
        consultationDate: consultation.createdAt,
        amount,
      });

      const pdfPath = this.savePdf(pdfBuffer, issuedAt, number);

      await this.prisma.invoice.create({
        data: {
          type: InvoiceType.PAYMENT_RECEIPT,
          number,
          issuedAt,
          recipientUserId: consultation.patient.user.id,
          recipientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
          amountHt: amount,
          tvaAmount: 0,
          amountTtc: amount,
          pdfPath,
          consultationId: consultation.id,
        },
      });

      this.logger.log(`Receipt ${number} created for consultation ${consultationId}`);
    } catch (err) {
      this.logger.error(`createPaymentReceipt failed for ${consultationId}: ${err}`);
    }
  }

  // ── Factures mensuelles médecins (cron + endpoint admin) ─────────────────

  async generateMonthlyInvoicesForMonth(
    year: number,
    month: number,
  ): Promise<{ generated: number }> {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const doctors = await this.prisma.doctor.findMany({
      where: {
        consultations: {
          some: {
            status: "COMPLETED",
            endedAt: { gte: periodStart, lte: periodEnd },
          },
        },
      },
      include: { user: { select: { id: true } } },
    });

    let generated = 0;
    for (const doctor of doctors) {
      try {
        const existing = await this.prisma.invoice.findFirst({
          where: {
            type: InvoiceType.MONTHLY_INVOICE,
            doctorId: doctor.id,
            periodStart: { gte: periodStart },
            periodEnd: { lte: periodEnd },
          },
        });
        if (existing) continue;

        const consultations = await this.prisma.consultation.findMany({
          where: {
            doctorId: doctor.id,
            status: "COMPLETED",
            endedAt: { gte: periodStart, lte: periodEnd },
          },
          select: { endedAt: true, amount: true },
          orderBy: { endedAt: "asc" },
        });
        if (consultations.length === 0) continue;

        const invoiceYear = new Date().getFullYear();
        const number = await this.numbering.generateNumber(
          InvoiceType.MONTHLY_INVOICE,
          invoiceYear,
        );
        const issuedAt = new Date();
        const totalBrut = consultations.reduce(
          (sum, c) => sum + Number(c.amount),
          0,
        );
        const commission = Math.round(totalBrut * this.commissionPercent) / 100;
        const netAmount = Math.round((totalBrut - commission) * 100) / 100;

        const pdfBuffer = await this.pdfGenerator.generateMonthlyInvoice({
          number,
          issuedAt,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          doctorOrdreNumber: doctor.ordreNumber,
          periodStart,
          periodEnd,
          consultations: consultations.map((c) => ({
            date: c.endedAt ?? issuedAt,
            amount: Number(c.amount),
          })),
          commissionPercent: this.commissionPercent,
        });

        const pdfPath = this.savePdf(pdfBuffer, issuedAt, number);

        await this.prisma.invoice.create({
          data: {
            type: InvoiceType.MONTHLY_INVOICE,
            number,
            issuedAt,
            periodStart,
            periodEnd,
            recipientUserId: doctor.user.id,
            recipientName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            amountHt: netAmount,
            tvaAmount: 0,
            amountTtc: netAmount,
            pdfPath,
            doctorId: doctor.id,
            metadata: {
              consultationCount: consultations.length,
              totalBrut,
              commission,
              netAmount,
            },
          },
        });

        generated++;
        this.logger.log(`Monthly invoice ${number} created for doctor ${doctor.id}`);
      } catch (err) {
        this.logger.error(
          `Monthly invoice failed for doctor ${doctor.id}: ${err}`,
        );
      }
    }

    return { generated };
  }

  // ── Lecture ───────────────────────────────────────────────────────────────

  async findMine(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { recipientUserId: userId },
        orderBy: { issuedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          number: true,
          type: true,
          status: true,
          issuedAt: true,
          amountTtc: true,
          periodStart: true,
          periodEnd: true,
          currency: true,
          consultationId: true,
        },
      }),
      this.prisma.invoice.count({ where: { recipientUserId: userId } }),
    ]);

    return {
      items: items.map((i) => ({
        ...i,
        amountTtc: Number(i.amountTtc),
        issuedAt: i.issuedAt.toISOString(),
        periodStart: i.periodStart?.toISOString() ?? null,
        periodEnd: i.periodEnd?.toISOString() ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  async findByConsultation(consultationId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { consultationId },
      select: {
        id: true,
        number: true,
        amountTtc: true,
        issuedAt: true,
        status: true,
        recipientUserId: true,
      },
    });
    if (!invoice) return null;
    if (invoice.recipientUserId !== userId) throw new ForbiddenException();

    return {
      id: invoice.id,
      number: invoice.number,
      amountTtc: Number(invoice.amountTtc),
      issuedAt: invoice.issuedAt.toISOString(),
      status: invoice.status,
    };
  }

  async findOne(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException("Facture introuvable");
    if (invoice.recipientUserId !== userId) throw new ForbiddenException();
    return invoice;
  }

  async getDownloadPath(id: string, userId: string): Promise<{ filePath: string; number: string }> {
    const invoice = await this.findOne(id, userId);
    if (!fs.existsSync(invoice.pdfPath)) {
      throw new NotFoundException("Fichier PDF introuvable");
    }
    return { filePath: invoice.pdfPath, number: invoice.number };
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private savePdf(buffer: Buffer, date: Date, number: string): string {
    const dirPath = path.join(
      this.storagePath,
      String(date.getFullYear()),
      String(date.getMonth() + 1).padStart(2, "0"),
    );
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, `${number}.pdf`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }
}
