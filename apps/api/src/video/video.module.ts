import { Module } from "@nestjs/common";
import { VideoProviderModule } from "./video-provider.module";
import { VideoService } from "./video.service";

@Module({
  imports: [VideoProviderModule],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
