import { NextResponse } from "next/server";
import { getCmsCloudflareEnv } from "@/lib/cms-cloudflare";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    const imageKey = key.join("/");

    if (!imageKey || imageKey.includes("..")) {
      return NextResponse.json({ error: "Invalid image key." }, { status: 400 });
    }

    const { sitetarik_cms_images: bucket } = await getCmsCloudflareEnv();

    if (!bucket) {
      return NextResponse.json({ error: "CMS image storage is not configured." }, { status: 503 });
    }

    const object = await bucket.get(imageKey);

    if (!object) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");

    return new Response(object.body, { headers });
  } catch {
    return NextResponse.json({ error: "CMS image storage is not available." }, { status: 503 });
  }
}
