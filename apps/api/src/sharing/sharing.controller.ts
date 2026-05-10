import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SharingConsentService } from "./sharing-consent.service";
import { ExcludeConsultationDto } from "./dto/sharing-consent.dto";

@Controller()
export class SharingController {
  constructor(private readonly sharingConsent: SharingConsentService) {}

  @Get("patients/me/sharing-consent")
  @UseGuards(JwtAuthGuard)
  getConsent(@Request() req: { user: { id: string } }) {
    return this.sharingConsent.getConsent(req.user.id);
  }

  @Post("patients/me/sharing-consent")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  enableConsent(
    @Request() req: { user: { id: string }; headers: Record<string, string>; ip: string },
    @Ip() ip: string,
  ) {
    const ua = req.headers["user-agent"];
    return this.sharingConsent.enableConsent(req.user.id, ip || "unknown", ua);
  }

  @Delete("patients/me/sharing-consent")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  disableConsent(
    @Request() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.sharingConsent.disableConsent(req.user.id, ip || "unknown");
  }

  @Get("patients/me/sharing-history")
  @UseGuards(JwtAuthGuard)
  getSharingHistory(@Request() req: { user: { id: string } }) {
    return this.sharingConsent.getSharingHistory(req.user.id);
  }

  @Get("patients/me/sharing-excluded")
  @UseGuards(JwtAuthGuard)
  getExcludedConsultations(@Request() req: { user: { id: string } }) {
    return this.sharingConsent.getExcludedConsultations(req.user.id);
  }

  @Patch("consultations/:id/exclude-from-sharing")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  excludeConsultation(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: ExcludeConsultationDto,
  ) {
    return this.sharingConsent.excludeConsultation(id, req.user.id, dto.reason);
  }

  @Patch("consultations/:id/include-in-sharing")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  includeConsultation(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.sharingConsent.includeConsultation(id, req.user.id);
  }
}
