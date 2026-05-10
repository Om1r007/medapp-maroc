import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medapp.ma";

export function buildMetadata(override: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    ...override,
  };
}
