import "server-only";
import { readOptionalEnvValue } from "@/lib/env.shared";

type StripeKeyMode = "live" | "test" | "invalid" | "missing";
type SiteUrlMode = "valid" | "invalid" | "missing";

function normalizeUrl(value: string) {
  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http:// or https://.");
  }

  return parsedUrl.toString().replace(/\/+$/, "");
}

function getSiteUrlMode(siteUrl: string | null): SiteUrlMode {
  if (!siteUrl) {
    return "missing";
  }

  try {
    normalizeUrl(siteUrl);
    return "valid";
  } catch {
    return "invalid";
  }
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
  const siteUrl = readOptionalEnvValue("NEXT_PUBLIC_SITE_URL");

  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL. Set the canonical SiteTarik URL before deploying.");
  }

  return normalizeUrl(siteUrl);
}

export function getRequiredStripeSecretKey() {
  const secretKey = readOptionalEnvValue("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY. Configure it in your deployment environment before calling Stripe.");
  }

  if (getStripeKeyMode(secretKey) === "invalid") {
    throw new Error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.");
  }

  return secretKey;
}

export function getStripeEnvironmentSnapshot() {
  const secretKey = readOptionalEnvValue("STRIPE_SECRET_KEY");
  const siteUrl = readOptionalEnvValue("NEXT_PUBLIC_SITE_URL");
  const siteUrlMode = getSiteUrlMode(siteUrl);

  return {
    hasStripeSecretKey: Boolean(secretKey),
    stripeKeyMode: getStripeKeyMode(secretKey),
    hasSiteUrl: Boolean(siteUrl),
    siteUrlMode,
  };
}
