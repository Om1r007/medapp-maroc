import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/guards/roles.guard";
import { PreConsultService } from "./pre-consult.service";
import { PreConsultDto } from "./dto/pre-consult.dto";

@Controller("consultations")
@UseGuards(JwtAuthGuard)
export class PreConsultController {
  constructor(private readonly preConsult: PreConsultService) {}

  @Post(":id/pre-consult")
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles("PATIENT")
  submit(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: PreConsultDto,
  ) {
    return this.preConsult.submitPreConsult(id, req.user.id, dto);
  }

  @Get(":id/pre-consult/brief")
  @UseGuards(RolesGuard)
  @Roles("DOCTOR")
  getBrief(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.preConsult.getBrief(id, req.user.id);
  }

  @Get(":id/pre-consult")
  @UseGuards(RolesGuard)
  @Roles("PATIENT")
  getPatientBrief(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.preConsult.getPatientBrief(id, req.user.id);
  }
}

@Controller("symptoms")
export class SymptomsController {
  @Get("suggestions")
  getSuggestions() {
    return {
      symptoms: [
        "Fièvre",
        "Toux",
        "Mal de gorge",
        "Mal de tête",
        "Mal de ventre / Diarrhée",
        "Vomissements",
        "Douleur thoracique",
        "Essoufflement",
        "Éruption cutanée",
        "Allergie / Démangeaisons",
        "Douleur articulaire",
        "Mal de dos",
        "Fatigue intense",
        "Anxiété / Stress",
        "Insomnie",
        "Brûlures urinaires",
        "Conjonctivite",
        "Mal d'oreille",
        "Vertiges",
        "Nausées",
        "Ballonnements",
        "Constipation",
        "Saignement",
        "Renouvellement ordonnance",
        "Conseil médical",
        "Suivi consultation précédente",
        "Bilan / Préventif",
        "Question médicale",
        "Certificat médical",
        "Autre",
      ],
    };
  }
}
