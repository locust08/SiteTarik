import { getStripeEnvironmentSnapshot } from "@/lib/env";

export async function GET() {
  const snapshot = getStripeEnvironmentSnapshot();

  if (snapshot.siteUrlMode === "missing") {
    return Response.json({
      ready: false,
      message: "Checkout is not configured yet. Add NEXT_PUBLIC_SITE_URL to .env.local or your deployment environment and restart the app.",
    });
  }

  if (snapshot.siteUrlMode === "invalid") {
    return Response.json({
      ready: false,
      message: "Checkout is not configured yet. NEXT_PUBLIC_SITE_URL must be a valid http:// or https:// URL.",
    });
  }

  if (!snapshot.hasStripeSecretKey) {
    return Response.json({
      ready: false,
      message: "Checkout is not configured yet. Add STRIPE_SECRET_KEY to .env.local or your deployment environment to enable payment.",
    });
  }

  if (snapshot.stripeKeyMode === "invalid") {
    return Response.json({
      ready: false,
      message: "Checkout is not configured yet. STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.",
    });
  }

  return Response.json({ ready: true, message: "" });
}
