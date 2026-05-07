export const VIDEO_PROVIDER = "VIDEO_PROVIDER";

export interface VideoProvider {
  createRoom(
    consultationId: string,
  ): Promise<{ roomId: string; roomUrl: string }>;
  destroyRoom(roomId: string): Promise<void>;
  generateAccessToken(
    roomId: string,
    userName: string,
    isOwner: boolean,
  ): Promise<string>;
}
