import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "./admin.guard";
import { PrismaService } from "../prisma/prisma.service";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { Logger } from "@nestjs/common";

class VerifyDoctorDto {
  @IsBoolean()
  declare approved: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Patch("doctors/:id/verify")
  async verifyDoctor(
    @Param("id") id: string,
    @Body() dto: VerifyDoctorDto,
  ) {
    if (dto.approved) {
      await this.prisma.doctor.update({
        where: { id },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          verificationStep: "APPROVED",
        },
      });
      this.logger.log(`Doctor ${id} approved`);
    } else {
      await this.prisma.doctor.update({
        where: { id },
        data: {
          status: "REJECTED",
          suspensionReason: dto.rejectionReason ?? "Dossier incomplet",
        },
      });
      this.logger.log(`Doctor ${id} rejected: ${dto.rejectionReason}`);
    }
    return { success: true };
  }

  @Post("doctors/:id/reactivate")
  async reactivateDoctor(@Param("id") id: string) {
    await this.prisma.doctor.update({
      where: { id },
      data: {
        status: "VERIFIED",
        suspensionReason: null,
        suspendedAt: null,
      },
    });
    this.logger.log(`Doctor ${id} reactivated by admin`);
    return { success: true };
  }

  @Get("doctors/pending")
  async getPendingDoctors() {
    const doctors = await this.prisma.doctor.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        speciality: true,
        ordreNumber: true,
        inpe: true,
        verificationStep: true,
        createdAt: true,
        user: { select: { email: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return doctors;
  }
}
