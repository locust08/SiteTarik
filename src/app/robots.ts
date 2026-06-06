import type { MetadataRoute } from "next";

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sitetarik.com";

  try {
    const parsedUrl = new URL(rawSiteUrl);
    parsedUrl.protocol = "https:";
    parsedUrl.hostname = "sitetarik.com";
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
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cms", "/thank-you", "/blog-brief"],
      },
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot", "Applebot"],
        allow: "/",
        disallow: ["/api/", "/cms", "/thank-you", "/blog-brief"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot"],
        allow: "/",
        disallow: ["/api/", "/cms", "/thank-you", "/blog-brief"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
