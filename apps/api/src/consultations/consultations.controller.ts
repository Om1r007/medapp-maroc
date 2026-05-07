import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/guards/roles.guard";
import { ConsultationsService } from "./consultations.service";
import { CreateConsultationDto } from "./dto/create-consultation.dto";

@Controller("consultations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Post()
  @Roles("PATIENT")
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateConsultationDto,
  ) {
    return this.consultations.create(req.user.id, dto);
  }

  @Get("me/active")
  @Roles("PATIENT")
  getActive(@Request() req: { user: { id: string } }) {
    return this.consultations.getActive(req.user.id);
  }

  @Get("me")
  @Roles("PATIENT")
  findMine(@Request() req: { user: { id: string } }) {
    return this.consultations.findMine(req.user.id);
  }

  @Get(":id/queue-status")
  @Roles("PATIENT")
  getQueueStatus(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.consultations.getQueueStatus(id, req.user.id);
  }

  // Accessible patient ET médecin (ownership vérifié dans le service)
  @Get(":id/video-token")
  getVideoToken(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.consultations.getVideoToken(id, req.user.id);
  }

  // Accessible patient ET médecin (ownership vérifié dans le service)
  @Get(":id/summary")
  getSummary(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.consultations.getSummary(id, req.user.id);
  }

  @Get(":id")
  @Roles("PATIENT")
  findOne(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.consultations.findOne(id, req.user.id);
  }

  @Delete(":id")
  @HttpCode(200)
  @Roles("PATIENT")
  cancel(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.consultations.cancel(id, req.user.id);
  }
}
