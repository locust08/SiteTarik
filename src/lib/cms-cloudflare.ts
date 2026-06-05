import { getCloudflareContext } from "@opennextjs/cloudflare";

type CmsCloudflareEnv = {
  sitetarik_cms?: D1Database;
  sitetarik_cms_images?: R2Bucket;
};

export async function getCmsCloudflareEnv() {
  const context = await getCloudflareContext({ async: true });

  return context.env as CmsCloudflareEnv;
}

export function isCmsWriteAuthorised(request: Request) {
  const expectedPassword = process.env.CMS_PASSWORD || "123";
  const providedPassword = request.headers.get("x-cms-password") || "";

  return providedPassword === expectedPassword;
}
