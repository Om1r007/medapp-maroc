import { InternalServerErrorException } from "@nestjs/common";
import type { VideoProvider } from "../video-provider.interface";

export class DailyVideoProvider implements VideoProvider {
  constructor(
    private readonly apiKey: string,
    private readonly domain: string,
  ) {}

  async createRoom(consultationId: string) {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `consult-${consultationId}`,
        privacy: "private",
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 2,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new InternalServerErrorException(
        `Daily.co createRoom failed (${res.status}): ${body}`,
      );
    }

    const data = (await res.json()) as { name: string; url: string };
    return { roomId: data.name, roomUrl: data.url };
  }

  async destroyRoom(roomId: string) {
    const res = await fetch(`https://api.daily.co/v1/rooms/${roomId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok && res.status !== 404) {
      const body = await res.text();
      throw new InternalServerErrorException(
        `Daily.co destroyRoom failed (${res.status}): ${body}`,
      );
    }
  }

  async generateAccessToken(
    roomId: string,
    userName: string,
    isOwner: boolean,
  ) {
    const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: roomId,
          user_name: userName,
          is_owner: isOwner,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new InternalServerErrorException(
        `Daily.co generateToken failed (${res.status}): ${body}`,
      );
    }

    const data = (await res.json()) as { token: string };
    return data.token;
  }
}
