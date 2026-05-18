import type { MetadataRoute } from "next";

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitetarik.com";

  try {
    const parsedUrl = new URL(rawSiteUrl);
    parsedUrl.hash = "";
    parsedUrl.search = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return "https://sitetarik.com";
  }
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
