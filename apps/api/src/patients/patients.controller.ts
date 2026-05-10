import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Put,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PatientsService } from "./patients.service";
import { UpdatePatientProfileDto } from "./dto/update-profile.dto";
import { UpdateHealthProfileDto } from "./dto/update-health.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";

@Controller("patients")
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get("me/dashboard-summary")
  getDashboardSummary(@Request() req: { user: { id: string } }) {
    return this.patients.getDashboardSummary(req.user.id);
  }

  @Get("me/consultations")
  getConsultations(
    @Request() req: { user: { id: string } },
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("search") search?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.patients.getConsultations(req.user.id, {
      status,
      from,
      to,
      search,
      page,
      limit,
    });
  }

  @Get("me")
  getMe(@Request() req: { user: { id: string } }) {
    return this.patients.getMe(req.user.id);
  }

  @Put("me/profile")
  @HttpCode(200)
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.patients.updateProfile(req.user.id, dto);
  }

  @Put("me/health-profile")
  @HttpCode(200)
  updateHealthProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateHealthProfileDto,
  ) {
    return this.patients.updateHealthProfile(req.user.id, dto);
  }

  @Put("me/password")
  @HttpCode(200)
  updatePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.patients.updatePassword(req.user.id, dto);
  }

  @Post("me/photo")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("photo"))
  uploadPhoto(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.patients.updatePhoto(req.user.id, file.filename);
  }

  // ── Médecin référent — Brique 6.4 ──────────────────────────────────────────

  @Get("me/referring-doctor")
  getReferringDoctor(@Request() req: { user: { id: string } }) {
    return this.patients.getReferringDoctor(req.user.id);
  }

  @Patch("me/referring-doctor")
  @HttpCode(200)
  setReferringDoctor(
    @Request() req: { user: { id: string } },
    @Body("doctorId") doctorId: string,
  ) {
    return this.patients.setReferringDoctor(req.user.id, doctorId);
  }

  @Delete("me/referring-doctor")
  @HttpCode(200)
  removeReferringDoctor(@Request() req: { user: { id: string } }) {
    return this.patients.removeReferringDoctor(req.user.id);
  }

  @Get("me/past-doctors")
  getPastDoctors(@Request() req: { user: { id: string } }) {
    return this.patients.getPastDoctors(req.user.id);
  }

  @Get(":patientId/summary-for-doctor")
  @HttpCode(200)
  getPatientSummary(
    @Param("patientId") patientId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.patients.getPatientSummaryForDoctor(patientId, req.user.id);
  }
}
