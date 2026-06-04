import type { MetadataRoute } from "next";
import { sitemapLastModified } from "@/generated/sitemap-last-modified";

const SITE_URL_FALLBACK = "https://sitetarik.com";

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK;

  try {
    const parsedUrl = new URL(rawSiteUrl);
    parsedUrl.hash = "";
    parsedUrl.search = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return SITE_URL_FALLBACK;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date(sitemapLastModified);

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
