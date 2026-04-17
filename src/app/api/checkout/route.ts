import Stripe from "stripe";

export const runtime = "nodejs";

type PackagePlan = "core" | "blog";

type CheckoutRequest = {
  selectedPackage?: PackagePlan;
  fullName?: string;
  businessName?: string;
  websiteUrl?: string;
  emailAddress?: string;
  targetLocation?: string;
};

const packageConfig: Record<
  PackagePlan,
  {
    title: string;
    amount: number;
    description: string;
    mode: "payment" | "subscription";
  }
> = {
  core: {
    title: "Core Relaunch",
    amount: 10000,
    description: "Annual core relaunch package with basic SEO and hosting handoff.",
    mode: "subscription",
  },
  blog: {
    title: "SEO Enhancement",
    amount: 22000,
    description: "One-time SEO enhancement package with 12 weekly blog releases.",
    mode: "payment",
  },
};

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add your Stripe test secret key to .env.local.");
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test-mode key that starts with sk_test_.");
  }

  return secretKey;
}

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function trimMetadataValue(value: string | undefined) {
  return value?.slice(0, 500) ?? "";
}

export async function POST(request: Request) {
  let payload: CheckoutRequest;

  try {
    payload = (await request.json()) as CheckoutRequest;
  } catch {
    return Response.json(
      { error: "Invalid checkout payload." },
      { status: 400 },
    );
  }

  const selectedPackage = payload.selectedPackage;

  if (selectedPackage !== "core" && selectedPackage !== "blog") {
    return Response.json(
      { error: "Please choose a valid package." },
      { status: 400 },
    );
  }

  const packageDetails = packageConfig[selectedPackage];

  try {
    const stripe = new Stripe(getStripeSecretKey());

    const baseUrl = getBaseUrl(request);
    const successPath = selectedPackage === "blog" ? "/blog-brief" : "/thank-you";
    const lineItem =
      packageDetails.mode === "subscription"
        ? {
            quantity: 1,
            price_data: {
              currency: "myr",
              unit_amount: packageDetails.amount,
              product_data: {
                name: packageDetails.title,
                description: packageDetails.description,
              },
              recurring: { interval: "year" as const },
            },
          }
        : {
            quantity: 1,
            price_data: {
              currency: "myr",
              unit_amount: packageDetails.amount,
              product_data: {
                name: packageDetails.title,
                description: packageDetails.description,
              },
            },
          };

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: packageDetails.mode,
      allow_promotion_codes: true,
      customer_email: payload.emailAddress?.trim() || undefined,
      client_reference_id: trimMetadataValue(payload.emailAddress),
      success_url: `${baseUrl}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#contact`,
      metadata: {
        selectedPackage,
        packageTitle: packageDetails.title,
        fullName: trimMetadataValue(payload.fullName),
        businessName: trimMetadataValue(payload.businessName),
        websiteUrl: trimMetadataValue(payload.websiteUrl),
        emailAddress: trimMetadataValue(payload.emailAddress),
        targetLocation: trimMetadataValue(payload.targetLocation),
      },
      line_items: [lineItem],
    });

    if (!checkoutSession.url) {
      return Response.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return Response.json({
      url: checkoutSession.url,
      id: checkoutSession.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";

    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
