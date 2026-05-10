import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "../auth/guards/roles.guard";
import { RatingsService } from "./ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post("consultations/:id/rate")
  @HttpCode(201)
  @UseGuards(RolesGuard)
  @Roles("PATIENT")
  rateConsultation(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratings.createRating(id, req.user.id, dto);
  }

  @Get("consultations/:id/rating")
  @UseGuards(RolesGuard)
  @Roles("PATIENT")
  getConsultationRating(
    @Param("id") id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.ratings.getConsultationRating(id, req.user.id);
  }

  @Get("doctors/me/feedback")
  @UseGuards(RolesGuard)
  @Roles("DOCTOR")
  getDoctorFeedback(
    @Request() req: { user: { id: string } },
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.ratings.getDoctorFeedback(req.user.id, page, limit);
  }
}
