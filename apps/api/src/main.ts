import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sécurité : whitelist + transform automatique des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — autorise les 2 frontends
  app.enableCors({
    origin: [
      process.env.APP_URL_PATIENT ?? "http://localhost:3000",
      process.env.APP_URL_DOCTOR ?? "http://localhost:3001",
    ],
    credentials: true,
  });

  app.setGlobalPrefix("api");

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
