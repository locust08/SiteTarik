import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCmsCloudflareEnv, isCmsWriteAuthorised } from "@/lib/cms-cloudflare";
import { assertSafeUploadedImage, ImageUploadValidationError } from "@/lib/image-upload-security";

export const runtime = "nodejs";

const maxImageSize = 12 * 1024 * 1024;

function toSafeImageKey(file: File, bytes: Buffer, extension: string) {
  const baseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 12);

  return `blog/${baseName || "blog-image"}-${hash}.${extension}`;
}

function toArrayBuffer(bytes: Buffer) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
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

    if (file.size > maxImageSize) {
      return NextResponse.json({ error: "Image is too large. Please use an image under 12MB." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const imageDetails = assertSafeUploadedImage(bytes, file.type);

    const { sitetarik_cms_images: bucket } = await getCmsCloudflareEnv();

    if (!bucket) {
      return NextResponse.json({ error: "CMS image storage is not configured." }, { status: 503 });
    }

    const key = toSafeImageKey(file, bytes, imageDetails.extension);

    await bucket.put(key, toArrayBuffer(bytes), {
      httpMetadata: {
        contentType: imageDetails.mimeType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    return NextResponse.json({ imageUrl: `/api/cms/images/${key}` });
  } catch (error) {
    if (error instanceof ImageUploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "CMS image storage is not available." }, { status: 503 });
  }
}
