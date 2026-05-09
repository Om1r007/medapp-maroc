import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import PDFDocument from "pdfkit";

export interface PaymentReceiptData {
  number: string;
  issuedAt: Date;
  patientName: string;
  consultationDate: Date;
  amount: number;
}

export interface MonthlyInvoiceData {
  number: string;
  issuedAt: Date;
  doctorName: string;
  doctorOrdreNumber: string;
  periodStart: Date;
  periodEnd: Date;
  consultations: Array<{ date: Date; amount: number }>;
  commissionPercent: number;
}

const BRAND_BLUE = "#1a56db";
const DARK = "#1a1a1a";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#9ca3af";
const TABLE_BG = "#f0f4ff";
const BORDER = "#d1d5db";

@Injectable()
export class PdfGeneratorService {
  private readonly companyName: string;
  private readonly companyAddress: string;
  private readonly companyIce: string;
  private readonly companyIf: string;
  private readonly companyRc: string;
  private readonly companyEmail: string;
  private readonly companyPhone: string;

  constructor(private readonly config: ConfigService) {
    this.companyName = config.get("COMPANY_NAME", "Medapp Maroc SARL");
    this.companyAddress = config.get("COMPANY_ADDRESS", "Casablanca, Maroc");
    this.companyIce = config.get("COMPANY_ICE", "000000000000000");
    this.companyIf = config.get("COMPANY_IF", "00000000");
    this.companyRc = config.get("COMPANY_RC", "000000 Casablanca");
    this.companyEmail = config.get("COMPANY_EMAIL", "contact@medapp.ma");
    this.companyPhone = config.get("COMPANY_PHONE", "+212522000000");
  }

  async generatePaymentReceipt(data: PaymentReceiptData): Promise<Buffer> {
    return this.buildPdf((doc) => {
      const { number, issuedAt, patientName, consultationDate, amount } = data;

      // ─── Header ────────────────────────────────────────────────────────
      doc.fontSize(20).font("Helvetica-Bold").fillColor(BRAND_BLUE)
        .text(this.companyName, 50, 50);
      doc.fontSize(14).fillColor(DARK).text("REÇU DE PAIEMENT");
      const afterTitle = doc.y + 6;
      doc.moveTo(50, afterTitle).lineTo(545, afterTitle)
        .strokeColor(BRAND_BLUE).lineWidth(2).stroke();

      // ─── Meta ──────────────────────────────────────────────────────────
      let y = afterTitle + 18;
      doc.fontSize(10).font("Helvetica").fillColor(DARK);
      doc.text(`N° ${number}`, 50, y);
      doc.text(`Date d'émission : ${this.fmt(issuedAt)}`, 350, y, { width: 195, align: "right" });

      // ─── Émetteur ──────────────────────────────────────────────────────
      y = doc.y + 22;
      this.sectionLabel(doc, "ÉMETTEUR", 50, y);
      y = doc.y + 3;
      doc.fontSize(10).font("Helvetica").fillColor(DARK);
      doc.text(this.companyName, 50, y);
      doc.text(this.companyAddress);
      doc.text(`ICE : ${this.companyIce}  |  IF : ${this.companyIf}  |  RC : ${this.companyRc}`);
      doc.text(`${this.companyPhone}  |  ${this.companyEmail}`);

      // ─── Destinataire ──────────────────────────────────────────────────
      y = doc.y + 18;
      this.sectionLabel(doc, "DESTINATAIRE", 50, y);
      y = doc.y + 3;
      doc.fontSize(10).font("Helvetica").fillColor(DARK).text(patientName, 50, y);

      // ─── Tableau ───────────────────────────────────────────────────────
      y = doc.y + 22;
      // Header row
      doc.fillColor(TABLE_BG).rect(50, y, 495, 22).fill();
      doc.fillColor("#374151").font("Helvetica-Bold").fontSize(9);
      doc.text("DÉSIGNATION", 54, y + 5, { width: 296 });
      doc.text("QTÉ", 354, y + 5, { width: 50, align: "center" });
      doc.text("MONTANT HT", 408, y + 5, { width: 133, align: "right" });

      // Data row
      y += 28;
      doc.fillColor(DARK).font("Helvetica").fontSize(10);
      const designation = `Téléconsultation médicale — ${this.fmt(consultationDate)}`;
      doc.text(designation, 54, y, { width: 296 });
      doc.text("1", 354, y, { width: 50, align: "center" });
      doc.text(`${amount.toFixed(2)} MAD`, 408, y, { width: 133, align: "right" });

      y = doc.y + 6;
      doc.moveTo(50, y).lineTo(545, y).strokeColor(BORDER).lineWidth(0.5).stroke();

      // ─── Totaux ────────────────────────────────────────────────────────
      y += 18;
      doc.fontSize(9).font("Helvetica").fillColor(GRAY);
      doc.text(`Montant HT : ${amount.toFixed(2)} MAD`, 50, y, { width: 495, align: "right" });
      y = doc.y + 3;
      doc.text(
        "TVA : 0,00 MAD  —  Exonéré de TVA (Article 91-I-C-1 du CGI)",
        50, y, { width: 495, align: "right" },
      );
      y = doc.y + 6;
      doc.moveTo(350, y).lineTo(545, y).strokeColor("#374151").lineWidth(1).stroke();
      y += 10;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(DARK)
        .text(`Montant TTC : ${amount.toFixed(2)} MAD`, 50, y, { width: 495, align: "right" });

      // ─── Pied de page ──────────────────────────────────────────────────
      doc.fontSize(8).fillColor(LIGHT_GRAY).font("Helvetica-Oblique").text(
        "Document généré automatiquement par Medapp Maroc, faisant foi de paiement.",
        50, 750, { align: "center", width: 495 },
      );
    });
  }

  async generateMonthlyInvoice(data: MonthlyInvoiceData): Promise<Buffer> {
    return this.buildPdf((doc) => {
      const {
        number, issuedAt, doctorName, doctorOrdreNumber,
        periodStart, periodEnd, consultations, commissionPercent,
      } = data;

      const totalBrut = consultations.reduce((s, c) => s + c.amount, 0);
      const commission = Math.round(totalBrut * commissionPercent) / 100;
      const netAmount = Math.round((totalBrut - commission) * 100) / 100;

      // ─── Header ────────────────────────────────────────────────────────
      doc.fontSize(18).font("Helvetica-Bold").fillColor(BRAND_BLUE)
        .text(this.companyName, 50, 50);
      doc.fontSize(13).fillColor(DARK).text("FACTURE — RÉTROCESSION D'HONORAIRES");
      const afterTitle = doc.y + 6;
      doc.moveTo(50, afterTitle).lineTo(545, afterTitle)
        .strokeColor(BRAND_BLUE).lineWidth(2).stroke();

      // ─── Meta ──────────────────────────────────────────────────────────
      let y = afterTitle + 18;
      doc.fontSize(10).font("Helvetica").fillColor(DARK);
      doc.text(`N° ${number}`, 50, y);
      doc.text(`Date d'émission : ${this.fmt(issuedAt)}`, 350, y, { width: 195, align: "right" });
      y = doc.y + 4;
      doc.text(
        `Période : du ${this.fmt(periodStart)} au ${this.fmt(periodEnd)}`,
        50, y,
      );

      // ─── Émetteur ──────────────────────────────────────────────────────
      y = doc.y + 20;
      this.sectionLabel(doc, "ÉMETTEUR", 50, y);
      y = doc.y + 3;
      doc.fontSize(10).font("Helvetica").fillColor(DARK);
      doc.text(this.companyName, 50, y);
      doc.text(this.companyAddress);
      doc.text(`ICE : ${this.companyIce}  |  IF : ${this.companyIf}  |  RC : ${this.companyRc}`);

      // ─── Destinataire ──────────────────────────────────────────────────
      y = doc.y + 16;
      this.sectionLabel(doc, "DESTINATAIRE", 50, y);
      y = doc.y + 3;
      doc.fontSize(10).font("Helvetica").fillColor(DARK);
      doc.text(`Dr. ${doctorName}`, 50, y);
      doc.text(`N° Ordre National des Médecins : ${doctorOrdreNumber}`);

      // ─── Récapitulatif ─────────────────────────────────────────────────
      y = doc.y + 20;
      doc.fontSize(11).font("Helvetica-Bold").fillColor(DARK).text("RÉCAPITULATIF", 50, y);
      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2)
        .strokeColor(BORDER).lineWidth(0.5).stroke();
      y = doc.y + 10;

      doc.fontSize(10).font("Helvetica").fillColor(DARK);
      doc.text(`Nombre de consultations`, 54, y, { width: 300 });
      doc.text(`${consultations.length}`, 354, y, { width: 187, align: "right" });

      y = doc.y + 4;
      doc.text(`Total honoraires bruts`, 54, y, { width: 300 });
      doc.text(`${totalBrut.toFixed(2)} MAD`, 354, y, { width: 187, align: "right" });

      y = doc.y + 4;
      doc.fillColor(GRAY);
      doc.text(`Commission Medapp (${commissionPercent}%)`, 54, y, { width: 300 });
      doc.text(`-${commission.toFixed(2)} MAD`, 354, y, { width: 187, align: "right" });

      y = doc.y + 8;
      doc.moveTo(50, y).lineTo(545, y).strokeColor(BORDER).lineWidth(0.5).stroke();
      y += 10;
      doc.fillColor(DARK).font("Helvetica-Bold").fontSize(11);
      doc.text("Net à payer au médecin", 54, y, { width: 300 });
      doc.text(`${netAmount.toFixed(2)} MAD`, 354, y, { width: 187, align: "right" });

      // ─── Exonération TVA ───────────────────────────────────────────────
      y = doc.y + 18;
      doc.fontSize(9).font("Helvetica").fillColor(GRAY);
      doc.text(`Montant HT : ${netAmount.toFixed(2)} MAD`, 50, y, { width: 495, align: "right" });
      y = doc.y + 2;
      doc.text("TVA : 0,00 MAD  —  Exonéré de TVA (Article 91-I-C-1 du CGI)", 50, y, { width: 495, align: "right" });
      y = doc.y + 6;
      doc.moveTo(350, y).lineTo(545, y).strokeColor("#374151").lineWidth(1).stroke();
      y += 10;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(DARK)
        .text(`Montant TTC : ${netAmount.toFixed(2)} MAD`, 50, y, { width: 495, align: "right" });

      // ─── Détail consultations ──────────────────────────────────────────
      y = doc.y + 24;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(DARK)
        .text("DÉTAIL DES CONSULTATIONS", 50, y);
      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2)
        .strokeColor(BORDER).lineWidth(0.5).stroke();
      y = doc.y + 8;

      // Table header
      doc.fillColor(TABLE_BG).rect(50, y, 495, 20).fill();
      doc.fillColor("#374151").font("Helvetica-Bold").fontSize(9);
      doc.text("DATE", 54, y + 4, { width: 200 });
      doc.text("MONTANT", 354, y + 4, { width: 187, align: "right" });

      y += 26;
      const maxRows = 30;
      const displayed = consultations.slice(0, maxRows);
      doc.font("Helvetica").fillColor(DARK).fontSize(9);

      for (const c of displayed) {
        doc.text(this.fmt(c.date), 54, y, { width: 200 });
        doc.text(`${c.amount.toFixed(2)} MAD`, 354, y, { width: 187, align: "right" });
        y = doc.y + 2;
        doc.moveTo(50, y).lineTo(545, y).strokeColor(BORDER).lineWidth(0.3).stroke();
        y += 4;
      }

      if (consultations.length > maxRows) {
        doc.fillColor(GRAY).fontSize(9)
          .text(
            `... et ${consultations.length - maxRows} autre(s) consultation(s)`,
            54, y, { width: 400 },
          );
        y = doc.y + 4;
      }

      // ─── Pied de page ──────────────────────────────────────────────────
      const footerY = Math.max(y + 30, 720);
      doc.fontSize(9).fillColor(GRAY).font("Helvetica-Oblique").text(
        "Le règlement sera effectué par virement bancaire avant le 15 du mois suivant.",
        50, footerY, { align: "center", width: 495 },
      );
      doc.fontSize(8).fillColor(LIGHT_GRAY).text(
        "Document généré automatiquement par Medapp Maroc.",
        50, footerY + 14, { align: "center", width: 495 },
      );
    });
  }

  private sectionLabel(doc: PDFKit.PDFDocument, label: string, x: number, y: number): void {
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888").text(label, x, y);
  }

  private fmt(d: Date): string {
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  private buildPdf(fn: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      try {
        fn(doc);
      } catch (err) {
        reject(err);
        return;
      }
      doc.end();
    });
  }
}
