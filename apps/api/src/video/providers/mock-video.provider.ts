import type { VideoProvider } from "../video-provider.interface";

export class MockVideoProvider implements VideoProvider {
  async createRoom(consultationId: string) {
    const roomId = `consult-${consultationId}`;
    console.log(`[MockVideo] createRoom: ${roomId}`);
    return { roomId, roomUrl: `https://mock.video/room/${roomId}` };
  }

  async destroyRoom(roomId: string) {
    console.log(`[MockVideo] destroyRoom: ${roomId}`);
  }

  async generateAccessToken(roomId: string, userName: string, isOwner: boolean) {
    console.log(
      `[MockVideo] generateToken: ${roomId} for "${userName}" (owner: ${isOwner})`,
    );
    return `mock-token-${roomId}-${Date.now()}`;
  }
}
