import {
  getStripeEnvironmentSnapshot,
  stripeApiRequest,
} from "@/lib/stripe-rest";
import {
  appendStripeMetadata,
} from "@/lib/stripe-metadata";
import {
  getRequestDebugContext,
  logServerError,
  logServerEvent,
} from "@/lib/server-debug";
import { getRequiredSiteUrl } from "@/lib/env";
import {
  parseTrackingSnapshot,
  snapshotToTrackingMetadata,
} from "@/lib/tracking/core";
import { buildRequestTrackingMetadata } from "@/lib/tracking/request";

type PackagePlan = "core" | "blog";

type CheckoutRequest = {
  selectedPackage?: PackagePlan;
  fullName?: string;
  businessName?: string;
  websiteUrl?: string;
  emailAddress?: string;
  whatsappNumber?: string;
  whatsappConsent?: boolean;
  businessType?: string;
  targetLocation?: string;
  tracking?: unknown;
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
    title: "Core Reborn",
    amount: 10000,
    description: "Annual core reborn package with basic SEO and hosting handoff.",
    mode: "subscription",
  },
  blog: {
    title: "SEO Enhancement",
    amount: 22000,
    description: "One-time SEO enhancement package with 12 weekly blog releases.",
    mode: "payment",
  },
};

function trimMetadataValue(value: string | undefined) {
  return value?.trim().slice(0, 120) ?? "";
}

function isValidWebsiteUrl(value: string) {
  try {
    const parsedUrl = new URL(value);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidWhatsAppNumber(value: string) {
  return /^\+60[0-9\s()-]{7,18}$/.test(value);
}

function createReceiptCode(selectedPackage: PackagePlan) {
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(-8).toUpperCase();

  return `ST-${selectedPackage.toUpperCase()}-${suffix || "PENDING"}`;
}

export async function POST(request: Request) {
  logServerEvent("api.checkout", "request received", {
    ...getRequestDebugContext(request),
    ...getStripeEnvironmentSnapshot(),
  });

  let payload: CheckoutRequest;

  try {
    payload = (await request.json()) as CheckoutRequest;
  } catch {
    logServerEvent("api.checkout", "invalid JSON payload", getRequestDebugContext(request));

    return Response.json(
      { error: "Invalid checkout payload." },
      { status: 400 },
    );
  }

  const selectedPackage = payload.selectedPackage;

  if (selectedPackage !== "core" && selectedPackage !== "blog") {
    logServerEvent("api.checkout", "rejected invalid package", {
      selectedPackage,
    });

    return Response.json(
      { error: "Please choose a valid package." },
      { status: 400 },
    );
  }

  const packageDetails = packageConfig[selectedPackage];
  const fullName = trimMetadataValue(payload.fullName);
  const businessName = trimMetadataValue(payload.businessName);
  const websiteUrl = trimMetadataValue(payload.websiteUrl);
  const emailAddress = trimMetadataValue(payload.emailAddress);
  const whatsappNumber = trimMetadataValue(payload.whatsappNumber);
  const whatsappConsent = payload.whatsappConsent === true;
  const businessType = trimMetadataValue(payload.businessType);
  const targetLocation = trimMetadataValue(payload.targetLocation);

  if (
    !fullName ||
    !businessName ||
    !websiteUrl ||
    !emailAddress ||
    !whatsappNumber ||
    !businessType ||
    !targetLocation
  ) {
    return Response.json(
      { error: "Please complete every required field before checkout." },
      { status: 400 },
    );
  }

  if (!isValidWebsiteUrl(websiteUrl)) {
    return Response.json(
      { error: "Please enter a valid website link that starts with http:// or https://." },
      { status: 400 },
    );
  }

  if (!isValidEmailAddress(emailAddress)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!isValidWhatsAppNumber(whatsappNumber)) {
    return Response.json(
      { error: "Please enter a valid WhatsApp number in +60 format." },
      { status: 400 },
    );
  }

  if (!whatsappConsent) {
    return Response.json(
      { error: "Please agree to be contacted through WhatsApp." },
      { status: 400 },
    );
  }

  try {
    const baseUrl = getRequiredSiteUrl();
    const successPath = selectedPackage === "blog" ? "/blog-brief" : "/thank-you";
    const receiptCode = createReceiptCode(selectedPackage);
    const bodyTrackingMetadata = payload.tracking
      ? parseTrackingSnapshot(JSON.stringify(payload.tracking))
      : null;
    const trackingMetadata = buildRequestTrackingMetadata(request);
    const mergedTrackingMetadata = bodyTrackingMetadata
      ? snapshotToTrackingMetadata(bodyTrackingMetadata)
      : trackingMetadata;
    const formData = new URLSearchParams();
    formData.set("mode", packageDetails.mode);
    formData.set("allow_promotion_codes", "true");
    formData.set("customer_email", emailAddress);
    formData.set("client_reference_id", receiptCode);
    formData.set("success_url", `${baseUrl}${successPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    formData.set("cancel_url", `${baseUrl}/#contact`);
    const orderMetadata = {
      selectedPackage,
      packageTitle: packageDetails.title,
      fullName,
      businessName,
      websiteUrl,
      emailAddress,
      whatsappNumber,
      whatsappConsent,
      businessType,
      targetLocation,
      receiptCode,
    };

    appendStripeMetadata(formData, "metadata", orderMetadata);
    if (mergedTrackingMetadata) {
      appendStripeMetadata(formData, "metadata", mergedTrackingMetadata);
    }
    formData.set("line_items[0][quantity]", "1");
    formData.set("line_items[0][price_data][currency]", "myr");
    formData.set("line_items[0][price_data][unit_amount]", String(packageDetails.amount));
    formData.set("line_items[0][price_data][product_data][name]", packageDetails.title);
    formData.set("line_items[0][price_data][product_data][description]", packageDetails.description);

    if (packageDetails.mode === "subscription") {
      formData.set("line_items[0][price_data][recurring][interval]", "year");
    }

    const checkoutSession = await stripeApiRequest<{
      url?: string;
      id?: string;
    }>("/checkout/sessions", {
      method: "POST",
      body: formData,
    });

    if (!checkoutSession.url) {
      logServerEvent("api.checkout", "Stripe session missing redirect URL", {
        selectedPackage,
      });

      return Response.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    logServerEvent("api.checkout", "checkout session created", {
      selectedPackage,
      mode: packageDetails.mode,
      hasCheckoutUrl: Boolean(checkoutSession.url),
      receiptCode,
    });

    return Response.json({
      url: checkoutSession.url,
      id: checkoutSession.id,
      receiptCode,
      packageTitle: packageDetails.title,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";

    logServerError("api.checkout", "checkout session creation failed", error, {
      selectedPackage,
      ...getStripeEnvironmentSnapshot(),
    });

    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
