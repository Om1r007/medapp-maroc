import { Controller, Get, Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    return {
      status: dbOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: { database: dbOk ? "up" : "down" },
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
