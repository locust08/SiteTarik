import { NextResponse } from "next/server";
import type { BlogCmsContent } from "@/lib/blog-content";
import { getServerBlogCmsContent } from "@/lib/blog-content-server";
import { getCmsCloudflareEnv, isCmsWriteAuthorised } from "@/lib/cms-cloudflare";

export const runtime = "nodejs";

const contentId = "blog-cms";

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

    const { sitetarik_cms: db } = await getCmsCloudflareEnv();

    if (!db) {
      return NextResponse.json({ error: "CMS database is not configured." }, { status: 503 });
    }

    await ensureContentTable(db);

    await db
      .prepare(
        "INSERT INTO cms_content (id, content, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at",
      )
      .bind(contentId, JSON.stringify(content), new Date().toISOString())
      .run();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "CMS database is not available." }, { status: 503 });
  }
}
