import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

// Vérifie que le médecin authentifié a le statut VERIFIED.
// À utiliser après JwtAuthGuard sur les routes médecin sensibles.
// Ne pas utiliser sur /doctors/me (un médecin PENDING doit pouvoir s'y voir).
@Injectable()
export class DoctorVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: { id: string; role: string } }>();
    const user = req.user;

    if (!user || user.role !== "DOCTOR") {
      throw new ForbiddenException("Accès réservé aux médecins");
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (!doctor || doctor.status !== "VERIFIED") {
      throw new ForbiddenException(
        "Votre compte médecin n'est pas encore vérifié",
      );
    }

    return true;
  }
}
