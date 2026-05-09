-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PAYMENT_RECEIPT', 'MONTHLY_INVOICE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'CANCELLED', 'PAID');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "recipientUserId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientIce" TEXT,
    "amountHt" DECIMAL(10,2) NOT NULL,
    "tvaAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountTtc" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "pdfPath" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "consultationId" TEXT,
    "doctorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_consultationId_key" ON "Invoice"("consultationId");

-- CreateIndex
CREATE INDEX "Invoice_recipientUserId_type_idx" ON "Invoice"("recipientUserId", "type");

-- CreateIndex
CREATE INDEX "Invoice_type_periodStart_idx" ON "Invoice"("type", "periodStart");

-- CreateIndex
CREATE INDEX "Invoice_doctorId_type_idx" ON "Invoice"("doctorId", "type");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
