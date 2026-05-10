import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medapp.ma";

const pages = [
  { path: "/", priority: 1.0, changeFreq: "weekly" },
  { path: "/comment-ca-marche", priority: 0.9, changeFreq: "monthly" },
  { path: "/tarifs", priority: 0.9, changeFreq: "monthly" },
  { path: "/medecins", priority: 0.8, changeFreq: "monthly" },
  { path: "/securite", priority: 0.7, changeFreq: "monthly" },
  { path: "/contact", priority: 0.7, changeFreq: "monthly" },
  { path: "/a-propos", priority: 0.6, changeFreq: "monthly" },
  { path: "/mentions-legales", priority: 0.3, changeFreq: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFreq: "yearly" },
  { path: "/cgu", priority: 0.3, changeFreq: "yearly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority, changeFreq }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFreq,
    priority,
  }));
}
