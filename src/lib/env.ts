import "server-only";

type StripeKeyMode = "live" | "test" | "invalid" | "missing";

function readEnvValue(name: string) {
  const value = globalThis.process?.env?.[name]?.trim();

  return value && value.length > 0 ? value : null;
}

function normalizeUrl(value: string) {
  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http:// or https://.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

function getStripeKeyMode(secretKey: string | null): StripeKeyMode {
  if (!secretKey) {
    return "missing";
  }

  if (secretKey.startsWith("sk_live_")) {
    return "live";
  }

  if (secretKey.startsWith("sk_test_")) {
    return "test";
  }

  return "invalid";
}

export function getRequiredSiteUrl() {
  const siteUrl = readEnvValue("NEXT_PUBLIC_SITE_URL");

  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL. Set the canonical SiteTarik URL before deploying.");
  }

  return normalizeUrl(siteUrl);
}

export function getRequiredStripeSecretKey() {
  const secretKey = readEnvValue("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY. Configure it in your deployment environment before calling Stripe.");
  }

  if (getStripeKeyMode(secretKey) === "invalid") {
    throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  }

  return secretKey;
}

export function getStripeEnvironmentSnapshot() {
  const secretKey = readEnvValue("STRIPE_SECRET_KEY");
  const siteUrl = readEnvValue("NEXT_PUBLIC_SITE_URL");

  return {
    hasStripeSecretKey: Boolean(secretKey),
    stripeKeyMode: getStripeKeyMode(secretKey),
    hasSiteUrl: Boolean(siteUrl),
  };
}
