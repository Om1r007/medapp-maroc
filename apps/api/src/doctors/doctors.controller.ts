import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DoctorVerifiedGuard } from "../auth/guards/doctor-verified.guard";
import { DoctorsService } from "./doctors.service";
import { UpdateAvailabilityDto } from "./dto/update-availability.dto";
import { EndConsultationDto } from "../consultations/dto/end-consultation.dto";

@Controller("doctors")
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

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
}
