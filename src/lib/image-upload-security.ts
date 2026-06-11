const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const maxImageWidth = 6000;
const maxImageHeight = 6000;
const maxImagePixels = 30_000_000;

export type SafeImageType = "image/jpeg" | "image/png" | "image/webp";

export const extensionBySafeImageType: Record<SafeImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ImageUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadValidationError";
  }
}

type ImageDetails = {
  mimeType: SafeImageType;
  extension: string;
  width: number;
  height: number;
};

function hasBytes(bytes: Buffer, offset: number, values: number[]) {
  return values.every((value, index) => bytes[offset + index] === value);
}

function readUint24LE(bytes: Buffer, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

function readJpegDimensions(bytes: Buffer) {
  if (!hasBytes(bytes, 0, [0xff, 0xd8])) {
    return null;
  }

  let offset = 2;
  const sofMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = bytes.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return null;
    }

    if (sofMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

function readPngDimensions(bytes: Buffer) {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (bytes.length < 24 || !hasBytes(bytes, 0, pngSignature) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    return null;
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function readWebpDimensions(bytes: Buffer) {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = bytes.toString("ascii", 12, 16);

  if (chunkType === "VP8X" && bytes.length >= 30) {
    return {
      width: readUint24LE(bytes, 24) + 1,
      height: readUint24LE(bytes, 27) + 1,
    };
  }

  if (chunkType === "VP8 " && bytes.length >= 30 && hasBytes(bytes, 23, [0x9d, 0x01, 0x2a])) {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = bytes.readUInt32LE(21);

    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function getImageDetails(bytes: Buffer): ImageDetails | null {
  const jpeg = readJpegDimensions(bytes);

  if (jpeg) {
    return { mimeType: "image/jpeg", extension: "jpg", ...jpeg };
  }

  const png = readPngDimensions(bytes);

  if (png) {
    return { mimeType: "image/png", extension: "png", ...png };
  }

  const webp = readWebpDimensions(bytes);

  if (webp) {
    return { mimeType: "image/webp", extension: "webp", ...webp };
  }

  return null;
}

export function isAllowedImageExtension(extension: string) {
  return allowedImageExtensions.has(extension.replace(/^\./, "").toLowerCase());
}

export function assertSafeUploadedImage(bytes: Buffer, declaredType?: string) {
  if (declaredType && !allowedImageTypes.has(declaredType)) {
    throw new ImageUploadValidationError("Only JPG, PNG, or WebP images can be uploaded.");
  }

  const details = getImageDetails(bytes);

  if (!details) {
    throw new ImageUploadValidationError("The uploaded file does not appear to be a valid JPG, PNG, or WebP image.");
  }

  if (declaredType && details.mimeType !== declaredType) {
    throw new ImageUploadValidationError("Image file type does not match the uploaded file.");
  }

  if (
    details.width < 1 ||
    details.height < 1 ||
    details.width > maxImageWidth ||
    details.height > maxImageHeight ||
    details.width * details.height > maxImagePixels
  ) {
    throw new ImageUploadValidationError("Image dimensions are too large. Please use an image up to 6000 x 6000px.");
  }

  return details;
}
