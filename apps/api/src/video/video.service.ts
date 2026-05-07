import { Inject, Injectable } from "@nestjs/common";
import {
  VIDEO_PROVIDER,
  type VideoProvider,
} from "./video-provider.interface";

@Injectable()
export class VideoService {
  constructor(
    @Inject(VIDEO_PROVIDER) private readonly provider: VideoProvider,
  ) {}

  createRoom(consultationId: string) {
    return this.provider.createRoom(consultationId);
  }

  destroyRoom(roomId: string) {
    return this.provider.destroyRoom(roomId);
  }

  generateAccessToken(roomId: string, userName: string, isOwner: boolean) {
    return this.provider.generateAccessToken(roomId, userName, isOwner);
  }
}
