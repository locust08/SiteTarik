import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCmsCloudflareEnv, isCmsWriteAuthorised } from "@/lib/cms-cloudflare";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);
const extensionByType: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const maxImageSize = 12 * 1024 * 1024;

function toSafeImageKey(file: File, bytes: ArrayBuffer) {
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  const hash = createHash("sha1").update(Buffer.from(bytes)).digest("hex").slice(0, 12);
  const extension = extensionByType[file.type] || "jpg";

  return `blog/${baseName || "blog-image"}-${hash}.${extension}`;
}

export async function POST(request: Request) {
  try {
    if (!isCmsWriteAuthorised(request)) {
      return NextResponse.json({ error: "Unauthorised image upload." }, { status: 401 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Only common image files can be uploaded." }, { status: 400 });
    }

    if (file.size > maxImageSize) {
      return NextResponse.json({ error: "Image is too large. Please use an image under 12MB." }, { status: 413 });
    }

    const { sitetarik_cms_images: bucket } = await getCmsCloudflareEnv();

    if (!bucket) {
      return NextResponse.json({ error: "CMS image storage is not configured." }, { status: 503 });
    }

    const bytes = await file.arrayBuffer();
    const key = toSafeImageKey(file, bytes);

    await bucket.put(key, bytes, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    return NextResponse.json({ imageUrl: `/api/cms/images/${key}` });
  } catch {
    return NextResponse.json({ error: "CMS image storage is not available." }, { status: 503 });
  }
}
