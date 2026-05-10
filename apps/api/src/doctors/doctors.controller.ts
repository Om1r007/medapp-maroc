import {
  Body,
  Controller,
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
import { DoctorVerifiedGuard } from "../auth/guards/doctor-verified.guard";
import { DoctorsService } from "./doctors.service";
import { PatientsService } from "../patients/patients.service";
import { SharedFileAccessService } from "../sharing/shared-file-access.service";
import { UpdateAvailabilityDto } from "./dto/update-availability.dto";
import { EndConsultationDto } from "../consultations/dto/end-consultation.dto";

@Controller("doctors")
export class DoctorsController {
  constructor(
    private readonly doctors: DoctorsService,
    private readonly patients: PatientsService,
    private readonly sharedFileAccess: SharedFileAccessService,
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: { id: string } }) {
    return this.doctors.getMe(req.user.id);
  }

  @Patch("me/availability")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  updateAvailability(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.doctors.updateAvailability(req.user.id, dto.isAvailable);
  }

  @Get("me/pending-consultation")
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  getPendingConsultation(@Request() req: { user: { id: string } }) {
    return this.doctors.getPendingConsultation(req.user.id);
  }

  @Post("me/start-consultation/:consultationId")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  startConsultation(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.doctors.startConsultation(consultationId, req.user.id);
  }

  @Get("me/incomplete-consultations")
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  getIncompleteConsultations(@Request() req: { user: { id: string } }) {
    return this.doctors.getIncompleteConsultations(req.user.id);
  }

  @Post("me/end-consultation/:consultationId")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  endConsultation(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
    @Body() dto: EndConsultationDto,
  ) {
    return this.doctors.endConsultation(consultationId, req.user.id, dto);
  }

  @Get("me/consultations/:consultationId/patient-summary")
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  getPatientSummary(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.patients.getPatientSummaryForDoctor(consultationId, req.user.id);
  }

  @Get("me/quality-stats")
  @UseGuards(JwtAuthGuard)
  getQualityStats(@Request() req: { user: { id: string } }) {
    return this.doctors.getMyQualityStats(req.user.id);
  }

  @Get("me/referring-patients-count")
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  getReferringPatientsCount(@Request() req: { user: { id: string } }) {
    return this.doctors.getReferringPatientsCount(req.user.id);
  }

  @Get("me/consultations/:consultationId/patient-history")
  @UseGuards(JwtAuthGuard, DoctorVerifiedGuard)
  getPatientHistory(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
    @Ip() ip: string,
  ) {
    return this.sharedFileAccess.getPatientHistory(consultationId, req.user.id, ip || "unknown");
  }

  @Get(":id/next-availability")
  getNextAvailability(@Param("id") id: string) {
    return this.doctors.getNextAvailabilityForDoctor(id);
  }

  @Get(":id/public-profile")
  getPublicProfile(@Param("id") id: string) {
    return this.doctors.getPublicProfile(id);
  }
}
