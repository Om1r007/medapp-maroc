import { createHash } from "crypto";

export function hashIp(ip: string): string {
  const salt = process.env.AUDIT_IP_SALT ?? "medapp-default-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
