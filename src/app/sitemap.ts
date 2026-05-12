import type { MetadataRoute } from "next";

function getSiteUrl() {
  const fallbackUrl = "http://localhost:3000";
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || fallbackUrl;

  try {
    const parsedUrl = new URL(rawSiteUrl);
    parsedUrl.hash = "";
    parsedUrl.search = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date("2026-05-12T00:00:00.000Z");

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
