import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { isCmsWriteAuthorised } from "@/lib/cms-auth";
import {
  assertSafeUploadedImage,
  ImageUploadValidationError,
  isAllowedImageExtension,
} from "@/lib/image-upload-security";

export const runtime = "nodejs";

const maxImageSize = 12 * 1024 * 1024;

function isLocalRequest(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  return host.startsWith("127.0.0.1") || host.startsWith("localhost");
}

function toSafeFileName(filePath: string, extension: string) {
  const parsed = path.parse(filePath);
  const baseName = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  const hash = createHash("sha1").update(filePath).digest("hex").slice(0, 10);

  return `${baseName || "blog-image"}-${hash}.${extension}`;
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local image import only works on localhost." }, { status: 403 });
  }

  if (!isCmsWriteAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised image import." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { filePath?: unknown } | null;
  const filePath = typeof body?.filePath === "string" ? body.filePath.trim() : "";

  if (!filePath || !path.isAbsolute(filePath)) {
    return NextResponse.json({ error: "Please paste a full local image path." }, { status: 400 });
  }

  const extension = path.extname(filePath).toLowerCase();

  if (!isAllowedImageExtension(extension)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WebP images can be imported." }, { status: 400 });
  }

  const fileStat = await stat(filePath).catch(() => null);

  if (!fileStat?.isFile()) {
    return NextResponse.json({ error: "Image file was not found on this computer." }, { status: 404 });
  }

  if (fileStat.size > maxImageSize) {
    return NextResponse.json({ error: "Image is too large. Please use an image under 12MB." }, { status: 413 });
  }

  const bytes = await readFile(filePath);
  let imageDetails: ReturnType<typeof assertSafeUploadedImage>;

  try {
    imageDetails = assertSafeUploadedImage(bytes);
  } catch (error) {
    if (error instanceof ImageUploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }

  const uploadDir = path.join(process.cwd(), "public", "Image", "blog-uploads");
  const fileName = toSafeFileName(filePath, imageDetails.extension);
  const targetPath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(targetPath, bytes);

  return NextResponse.json({ imageUrl: `/Image/blog-uploads/${fileName}` });
}
