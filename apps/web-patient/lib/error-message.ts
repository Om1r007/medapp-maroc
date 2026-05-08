import { ApiError } from "./api";

export function extractErrorMessage(err: unknown, fallback = "Une erreur est survenue"): string {
  if (err instanceof ApiError) {
    const payload = err.payload as { message?: string | string[] } | null;
    const msg = payload?.message;
    if (Array.isArray(msg)) return msg[0] ?? fallback;
    if (typeof msg === "string") return msg;
    return fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
