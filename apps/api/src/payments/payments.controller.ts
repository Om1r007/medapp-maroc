import {
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
import { PaymentsService } from "./payments.service";

@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("PATIENT")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(":consultationId/simulate-success")
  @HttpCode(200)
  simulateSuccess(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.payments.simulateSuccess(consultationId, req.user.id);
  }

  @Post(":consultationId/simulate-failure")
  @HttpCode(200)
  simulateFailure(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.payments.simulateFailure(consultationId, req.user.id);
  }

  @Get(":consultationId/status")
  getStatus(
    @Param("consultationId") consultationId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.payments.getStatus(consultationId, req.user.id);
  }
}
