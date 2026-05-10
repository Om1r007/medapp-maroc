import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SharingConsentService } from "./sharing-consent.service";
import { SharedFileAccessService } from "./shared-file-access.service";
import { SharingController } from "./sharing.controller";

@Module({
  imports: [PrismaModule],
  controllers: [SharingController],
  providers: [SharingConsentService, SharedFileAccessService],
  exports: [SharingConsentService, SharedFileAccessService],
})
export class SharingModule {}
