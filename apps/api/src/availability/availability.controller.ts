import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard, Roles } from "../auth/guards/roles.guard";
import { DoctorVerifiedGuard } from "../auth/guards/doctor-verified.guard";
import { PrismaService } from "../prisma/prisma.service";
import { AvailabilityService } from "./availability.service";
import { AvailabilitySchedulerService } from "./availability-scheduler.service";
import { CreateSlotDto } from "./dto/create-slot.dto";
import { UpdateSlotDto } from "./dto/update-slot.dto";
import { CreateExceptionDto } from "./dto/create-exception.dto";
import { SetOverrideDto } from "./dto/set-override.dto";

@Controller("availability")
@UseGuards(JwtAuthGuard, RolesGuard, DoctorVerifiedGuard)
@Roles("DOCTOR")
export class AvailabilityController {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly scheduler: AvailabilitySchedulerService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Créneaux récurrents ────────────────────────────────────

  @Get("slots")
  async getSlots(@Request() req: { user: { id: string } }) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availability.getSlots(doctorId);
  }

  @Post("slots")
  async createSlot(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateSlotDto,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availability.createSlot(doctorId, dto);
  }

  @Patch("slots/:id")
  async updateSlot(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateSlotDto,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availability.updateSlot(id, doctorId, dto);
  }

  @Delete("slots/:id")
  @HttpCode(204)
  async deleteSlot(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    await this.availability.deleteSlot(id, doctorId);
  }

  // ── Exceptions ponctuelles ─────────────────────────────────

  @Get("exceptions")
  async getExceptions(
    @Request() req: { user: { id: string } },
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availability.getExceptions(doctorId, from, to);
  }

  @Post("exceptions")
  async createException(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateExceptionDto,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availability.createException(doctorId, dto);
  }

  @Delete("exceptions/:id")
  @HttpCode(204)
  async deleteException(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    await this.availability.deleteException(id, doctorId);
  }

  // ── Override manuel ────────────────────────────────────────

  @Post("override")
  @HttpCode(200)
  async setOverride(
    @Request() req: { user: { id: string } },
    @Body() dto: SetOverrideDto,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    await this.availability.setOverride(doctorId, dto);
    return { success: true };
  }

  @Delete("override")
  @HttpCode(200)
  async clearOverride(@Request() req: { user: { id: string } }) {
    const doctorId = await this.getDoctorId(req.user.id);
    await this.availability.clearOverride(doctorId);
    return { success: true };
  }

  // ── Vue calculée ───────────────────────────────────────────

  @Get("computed")
  async getComputed(
    @Request() req: { user: { id: string } },
    @Query("date") date: string,
  ) {
    const doctorId = await this.getDoctorId(req.user.id);
    return this.availability.getComputedSlots(doctorId, date);
  }

  // ── Debug (development only) ───────────────────────────────

  @Post("debug-trigger-scheduler")
  @HttpCode(200)
  async debugTrigger() {
    if (this.config.get("NODE_ENV") !== "development") {
      throw new NotFoundException();
    }
    return this.scheduler.runSync();
  }

  // ── Helper ────────────────────────────────────────────────

  private async getDoctorId(userId: string): Promise<string> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!doctor) throw new NotFoundException("Profil médecin introuvable");
    return doctor.id;
  }
}
