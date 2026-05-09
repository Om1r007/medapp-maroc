import { Inject, Injectable } from "@nestjs/common";
import { InvoiceType } from "@prisma/client";
import type Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";

export const INVOICES_REDIS_CLIENT = "INVOICES_REDIS_CLIENT";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

@Injectable()
export class InvoiceNumberingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(INVOICES_REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async generateNumber(type: InvoiceType, year: number, retries = 5): Promise<string> {
    const lockKey = `invoice-numbering:${type}:${year}`;
    // TODO: passer en SCAN en prod (>10K médecins) — KEYS bloque Redis
    const acquired = await this.redis.set(lockKey, "1", "EX", 10, "NX");

    if (!acquired) {
      if (retries <= 0) throw new Error("Could not acquire invoice numbering lock");
      await delay(100);
      return this.generateNumber(type, year, retries - 1);
    }

    try {
      const prefix = type === InvoiceType.PAYMENT_RECEIPT ? "RECU" : "FAC";
      const prefixStr = `${prefix}-${year}-`;

      const lastInvoice = await this.prisma.invoice.findFirst({
        where: { number: { startsWith: prefixStr } },
        orderBy: { number: "desc" },
      });

      const lastNumber = lastInvoice
        ? parseInt(lastInvoice.number.split("-")[2], 10)
        : 0;
      const next = lastNumber + 1;

      return `${prefix}-${year}-${next.toString().padStart(4, "0")}`;
    } finally {
      await this.redis.del(lockKey);
    }
  }
}
