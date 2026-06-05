import { createHash } from "node:crypto";
import { mkdir, stat, copyFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const allowedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const maxImageSize = 12 * 1024 * 1024;

function isLocalRequest(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  return host.startsWith("127.0.0.1") || host.startsWith("localhost");
}

function toSafeFileName(filePath: string) {
  const parsed = path.parse(filePath);
  const baseName = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  const hash = createHash("sha1").update(filePath).digest("hex").slice(0, 10);

  return `${baseName || "blog-image"}-${hash}${parsed.ext.toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local image import only works on localhost." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { filePath?: unknown } | null;
  const filePath = typeof body?.filePath === "string" ? body.filePath.trim() : "";

  if (!filePath || !path.isAbsolute(filePath)) {
    return NextResponse.json({ error: "Please paste a full local image path." }, { status: 400 });
  }

  const extension = path.extname(filePath).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({ error: "Only common image files can be imported." }, { status: 400 });
  }

  const fileStat = await stat(filePath).catch(() => null);

  if (!fileStat?.isFile()) {
    return NextResponse.json({ error: "Image file was not found on this computer." }, { status: 404 });
  }

  if (fileStat.size > maxImageSize) {
    return NextResponse.json({ error: "Image is too large. Please use an image under 12MB." }, { status: 413 });
  }

  const uploadDir = path.join(process.cwd(), "public", "Image", "blog-uploads");
  const fileName = toSafeFileName(filePath);
  const targetPath = path.join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await copyFile(filePath, targetPath);

  return NextResponse.json({ imageUrl: `/Image/blog-uploads/${fileName}` });
}
