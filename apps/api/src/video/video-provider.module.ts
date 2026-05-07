import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VIDEO_PROVIDER } from "./video-provider.interface";
import { DailyVideoProvider } from "./providers/daily-video.provider";
import { MockVideoProvider } from "./providers/mock-video.provider";

@Module({
  providers: [
    {
      provide: VIDEO_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get("VIDEO_PROVIDER", "daily");
        if (provider === "mock") return new MockVideoProvider();
        return new DailyVideoProvider(
          config.getOrThrow("DAILY_API_KEY"),
          config.get("DAILY_DOMAIN", ""),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [VIDEO_PROVIDER],
})
export class VideoProviderModule {}
