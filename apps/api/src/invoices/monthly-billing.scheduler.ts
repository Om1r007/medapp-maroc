import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InvoicesService } from "./invoices.service";

@Injectable()
export class MonthlyBillingScheduler {
  private readonly logger = new Logger(MonthlyBillingScheduler.name);

  constructor(private readonly invoicesService: InvoicesService) {}

  @Cron("0 0 2 1 * *", { timeZone: "Africa/Casablanca" })
  async generateMonthlyInvoices(): Promise<void> {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prevMonth.getFullYear();
    const month = prevMonth.getMonth() + 1;

    this.logger.log(
      `Generating monthly invoices for ${year}-${String(month).padStart(2, "0")}`,
    );

    try {
      const result = await this.invoicesService.generateMonthlyInvoicesForMonth(year, month);
      this.logger.log(`Generated ${result.generated} monthly invoice(s)`);
    } catch (err) {
      this.logger.error(`Monthly billing cron failed: ${err}`);
    }
  }
}
