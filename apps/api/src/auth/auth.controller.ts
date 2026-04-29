import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupPatientDto } from "./dto/signup-patient.dto";
import { SignupDoctorDto } from "./dto/signup-doctor.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup/patient")
  signupPatient(@Body() dto: SignupPatientDto) {
    return this.auth.signupPatient(dto);
  }

  @Post("signup/doctor")
  signupDoctor(@Body() dto: SignupDoctorDto) {
    return this.auth.signupDoctor(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Request() req: { user: { id: string; email: string; role: string } }) {
    return req.user;
  }
}
