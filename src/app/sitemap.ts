import type { MetadataRoute } from "next";
import { sitemapLastModified } from "@/generated/sitemap-last-modified";
import { getServerBlogCmsContent } from "@/lib/blog-content-server";

const SITE_URL_FALLBACK = "https://sitetarik.com";

export const dynamic = "force-dynamic";

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK;

  try {
    const parsedUrl = new URL(rawSiteUrl);
    parsedUrl.protocol = "https:";
    parsedUrl.hostname = "sitetarik.com";
    parsedUrl.hash = "";
    parsedUrl.search = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return SITE_URL_FALLBACK;
  }
}

function getValidDate(value: string | null | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? fallback : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const siteLastModified = new Date(sitemapLastModified);
  const { content, updatedAt } = await getServerBlogCmsContent();
  const publishedPosts = content.posts
    .filter((post) => post.status === "published" && post.slug.trim())
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  const blogLastModified = getValidDate(updatedAt ?? publishedPosts[0]?.publishDate, siteLastModified);

  return [
    {
      url: `${siteUrl}/`,
      lastModified: siteLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(publishedPosts.length > 0
      ? [
          {
            url: `${siteUrl}/blog`,
            lastModified: blogLastModified,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
        ]
      : []),
    ...publishedPosts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: getValidDate(updatedAt ?? post.publishDate, blogLastModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
