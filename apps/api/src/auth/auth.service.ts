import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { SignupPatientDto } from "./dto/signup-patient.dto";
import { SignupDoctorDto } from "./dto/signup-doctor.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./strategies/jwt.strategy";

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signupPatient(dto: SignupPatientDto) {
    await this.ensureUniqueIdentifiers(dto.email, dto.phone);

    const existingCin = await this.prisma.patient.findUnique({
      where: { cin: dto.cin },
    });
    if (existingCin)
      throw new ConflictException("Un patient avec cette CIN existe déjà");

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: "PATIENT",
        patient: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            cin: dto.cin.toUpperCase(),
            dateOfBirth: new Date(dto.dateOfBirth),
          },
        },
      },
      include: { patient: true },
    });

    return this.buildAuthResponse(user);
  }

  async signupDoctor(dto: SignupDoctorDto) {
    await this.ensureUniqueIdentifiers(dto.email, dto.phone);

    const existingCin = await this.prisma.doctor.findUnique({
      where: { cin: dto.cin },
    });
    if (existingCin)
      throw new ConflictException("Un médecin avec cette CIN existe déjà");

    const existingOrdre = await this.prisma.doctor.findUnique({
      where: { ordreNumber: dto.ordreNumber },
    });
    if (existingOrdre)
      throw new ConflictException("Numéro d'Ordre déjà enregistré");

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: "DOCTOR",
        doctor: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            cin: dto.cin.toUpperCase(),
            ordreNumber: dto.ordreNumber,
            speciality: dto.speciality,
            status: "PENDING", // Vérification manuelle requise
            ...(dto.inpe && { inpe: dto.inpe }),
            ...(dto.diplomaUniversity && { diplomaUniversity: dto.diplomaUniversity }),
            ...(dto.diplomaYear && { diplomaYear: dto.diplomaYear }),
            ...(dto.yearsOfExperience !== undefined && { yearsOfExperience: dto.yearsOfExperience }),
            ...(dto.languages?.length && { languages: dto.languages }),
            ...(dto.bio && { bio: dto.bio }),
            verificationStep: dto.inpe && dto.ordreNumber ? "PROFESSIONAL" : "IDENTITY",
          },
        },
      },
      include: { doctor: true },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    return this.buildAuthResponse(user);
  }

  // ---------- Helpers ----------

  private async ensureUniqueIdentifiers(email: string, phone: string) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail)
      throw new ConflictException("Cet email est déjà utilisé");

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone)
      throw new ConflictException("Ce téléphone est déjà utilisé");
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    role: "PATIENT" | "DOCTOR" | "ADMIN";
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_SECRET"),
      expiresIn: this.config.get<string>("JWT_EXPIRES_IN") ?? "15m",
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d",
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
