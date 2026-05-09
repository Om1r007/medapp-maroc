import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { InvoicesService } from "./invoices.service";

@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly config: ConfigService,
  ) {}

  @Get("me")
  async getMyInvoices(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.invoicesService.findMine(req.user.id, page, Math.min(limit, 50));
  }

  @Get("consultation/:consultationId")
  async getByConsultation(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.invoicesService.findByConsultation(consultationId, req.user.id);
  }

  @Get(":id")
  async getInvoice(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.invoicesService.findOne(id, req.user.id);
  }

  @Get(":id/download")
  async downloadInvoice(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    const { filePath, number } = await this.invoicesService.getDownloadPath(
      id,
      req.user.id,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.download(filePath, `${number}.pdf`);
  }
}

// ── Admin endpoint (force génération mensuelle) ──────────────────────────────

@Controller("admin/billing")
@UseGuards(JwtAuthGuard)
export class AdminBillingController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly config: ConfigService,
  ) {}

  @Post("generate-month")
  async generateMonth(
    @Query("year", new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Query("month", new DefaultValuePipe(new Date().getMonth()), ParseIntPipe) month: number,
  ) {
    // Basic guard — env check only. Add ADMIN role guard before prod.
    if (this.config.get("NODE_ENV") === "production") {
      return { error: "Not available in production — add ADMIN guard first" };
    }
    return this.invoicesService.generateMonthlyInvoicesForMonth(year, month);
  }
}
