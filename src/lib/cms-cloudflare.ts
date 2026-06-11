import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createHmac, timingSafeEqual } from "node:crypto";

type CmsCloudflareEnv = {
  sitetarik_cms?: D1Database;
  sitetarik_cms_images?: R2Bucket;
};

export const cmsSessionCookieName = "sitetarik_cms_session";
export const cmsSessionMaxAgeSeconds = 60 * 60 * 8;

export async function getCmsCloudflareEnv() {
  const context = await getCloudflareContext({ async: true });

  return context.env as CmsCloudflareEnv;
}

function getCmsPassword() {
  return process.env.CMS_PASSWORD?.trim() || "";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signCmsSession(expiresAt: number, password: string) {
  return createHmac("sha256", password).update(String(expiresAt)).digest("hex");
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function isCmsPasswordConfigured() {
  return Boolean(getCmsPassword());
}

export function verifyCmsPassword(providedPassword: string) {
  const expectedPassword = getCmsPassword();

  return Boolean(expectedPassword && providedPassword && safeEqual(providedPassword, expectedPassword));
}

export function createCmsSessionValue(date = new Date()) {
  const password = getCmsPassword();
  const expiresAt = date.getTime() + cmsSessionMaxAgeSeconds * 1000;
  const signature = signCmsSession(expiresAt, password);

  return `${expiresAt}.${signature}`;
}

export function isCmsWriteAuthorised(request: Request) {
  const expectedPassword = getCmsPassword();

  if (!expectedPassword) {
    return false;
  }

  const session = readCookie(request, cmsSessionCookieName);
  const [rawExpiresAt, signature] = session.split(".");
  const expiresAt = Number(rawExpiresAt);

  if (Number.isFinite(expiresAt) && expiresAt > Date.now() && signature) {
    const expectedSignature = signCmsSession(expiresAt, expectedPassword);

    if (safeEqual(signature, expectedSignature)) {
      return true;
    }
  }

  return false;
}
