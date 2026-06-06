import { defaultBlogContent, type BlogCmsContent } from "@/lib/blog-content";
import { getCmsCloudflareEnv } from "@/lib/cms-cloudflare";

type ServerBlogCmsContent = {
  content: BlogCmsContent;
  updatedAt: string | null;
};

function isBlogCmsContent(value: unknown): value is BlogCmsContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const content = value as Partial<BlogCmsContent>;
  return Boolean(content.overview && Array.isArray(content.posts));
}

function shouldUseDefaultOverview(content: BlogCmsContent) {
  const title = content.overview.title.trim().toLowerCase();
  const intro = content.overview.intro.trim().toLowerCase();

  return (
    !title ||
    !intro ||
    title === "blog" ||
    title.startsWith("what is sitetarik") ||
    intro.startsWith("sitetarik helps smes refresh their existing")
  );
}

function normaliseBlogCmsContent(content: BlogCmsContent): BlogCmsContent {
  if (!shouldUseDefaultOverview(content)) {
    return content;
  }

  return {
    ...content,
    overview: defaultBlogContent.overview,
  };
}

export async function getServerBlogCmsContent(): Promise<ServerBlogCmsContent> {
  try {
    const { sitetarik_cms: db } = await getCmsCloudflareEnv();

    if (!db) {
      return { content: defaultBlogContent, updatedAt: null };
    }

    const row = (await db
      .prepare("SELECT content, updated_at FROM cms_content WHERE id = ?")
      .bind("blog-cms")
      .first()) as { content?: string; updated_at?: string } | null;

    if (!row?.content) {
      return { content: defaultBlogContent, updatedAt: null };
    }

    const content = JSON.parse(row.content) as unknown;

    return {
      content: isBlogCmsContent(content) ? normaliseBlogCmsContent(content) : defaultBlogContent,
      updatedAt: row.updated_at ?? null,
    };
  } catch {
    return { content: defaultBlogContent, updatedAt: null };
  }
}
