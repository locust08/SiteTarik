import { NextResponse } from "next/server";
import type { BlogCmsContent } from "@/lib/blog-content";
import { getServerBlogCmsContent } from "@/lib/blog-content-server";
import { isCmsWriteAuthorised } from "@/lib/cms-auth";
import { getCmsCloudflareEnv } from "@/lib/cms-cloudflare";

export const runtime = "nodejs";

const contentId = "blog-cms";
const cmsImageUrlPrefix = "/api/cms/images/";
type R2BucketWithDelete = R2Bucket & {
  delete: (key: string) => Promise<void>;
};

function isBlogCmsContent(value: unknown): value is BlogCmsContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const content = value as Partial<BlogCmsContent>;

  return Boolean(content.overview && Array.isArray(content.posts));
}

async function ensureContentTable(db: D1Database) {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS cms_content (id TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at TEXT NOT NULL)",
    )
    .run();
}

function extractCmsImageKeys(content: BlogCmsContent) {
  const keys = new Set<string>();

  for (const post of content.posts) {
    for (const imageUrl of [post.thumbnailImage, post.featuredImage]) {
      if (!imageUrl.startsWith(cmsImageUrlPrefix)) {
        continue;
      }

      const key = decodeURIComponent(imageUrl.slice(cmsImageUrlPrefix.length));

      if (key && !key.includes("..")) {
        keys.add(key);
      }
    }
  }

  return keys;
}

async function getStoredCmsContent(db: D1Database) {
  const row = (await db
    .prepare("SELECT content FROM cms_content WHERE id = ?")
    .bind(contentId)
    .first()) as { content?: string } | null;

  if (!row?.content) {
    return null;
  }

  const parsedContent = JSON.parse(row.content) as unknown;

  return isBlogCmsContent(parsedContent) ? parsedContent : null;
}

async function deleteUnusedCmsImages(bucket: R2Bucket | undefined, previousContent: BlogCmsContent | null, nextContent: BlogCmsContent) {
  if (!bucket || !previousContent) {
    return;
  }

  const previousKeys = extractCmsImageKeys(previousContent);
  const nextKeys = extractCmsImageKeys(nextContent);
  const deletedKeys = [...previousKeys].filter((key) => !nextKeys.has(key));

  if (!deletedKeys.length) {
    return;
  }

  const deletableBucket = bucket as R2BucketWithDelete;

  await Promise.all(deletedKeys.map((key) => deletableBucket.delete(key)));
}

export async function GET() {
  const { content } = await getServerBlogCmsContent();

  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  try {
    if (!isCmsWriteAuthorised(request)) {
      return NextResponse.json({ error: "Unauthorised CMS save." }, { status: 401 });
    }

    const content = (await request.json().catch(() => null)) as unknown;

    if (!isBlogCmsContent(content)) {
      return NextResponse.json({ error: "Invalid CMS content." }, { status: 400 });
    }

    const { sitetarik_cms: db, sitetarik_cms_images: bucket } = await getCmsCloudflareEnv();

    if (!db) {
      return NextResponse.json({ error: "CMS database is not configured." }, { status: 503 });
    }

    await ensureContentTable(db);

    const previousContent = await getStoredCmsContent(db);

    await db
      .prepare(
        "INSERT INTO cms_content (id, content, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at",
      )
      .bind(contentId, JSON.stringify(content), new Date().toISOString())
      .run();

    await deleteUnusedCmsImages(bucket, previousContent, content);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "CMS database is not available." }, { status: 503 });
  }
}
