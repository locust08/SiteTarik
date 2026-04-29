import {
  getStripeEnvironmentSnapshot,
  stripeApiRequest,
} from "@/lib/stripe-rest";
import { appendStripeMetadata } from "@/lib/stripe-metadata";
import {
  getRequestDebugContext,
  logServerError,
  logServerEvent,
} from "@/lib/server-debug";

type BlogMetadataRequest = {
  sessionId?: string;
  selectedPackage?: string;
  packageTitle?: string;
  fullName?: string;
  businessName?: string;
  websiteUrl?: string;
  emailAddress?: string;
  whatsappNumber?: string;
  whatsappConsent?: boolean | string;
  businessType?: string;
  targetLocation?: string;
  briefBusinessDescription?: string;
  mainProductsServices?: string;
  mainGoal?: string;
  targetKeywords?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  toneOfWriting?: string;
  audienceShort?: string;
  idealCustomers?: string;
  topicsToCover?: string;
  blogTopicIdeas?: string;
  preferredCTA?: string;
  customCTA?: string;
  ctaText?: string;
  pagesToPush?: string;
  additionalNotes?: string;
  receiptCode?: string;
  orderDetails?: Record<string, string | string[]>;
  blogDetails?: Record<string, string | string[]>;
};

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function trimMetadataValue(value: string | undefined) {
  return value?.trim().slice(0, 120) ?? "";
}

function isPaidSession(session: { status?: string; payment_status?: string }) {
  return session.status === "complete" && session.payment_status === "paid";
}

function buildOrderMetadata(
  payload: BlogMetadataRequest,
  sessionMetadata: Record<string, string | undefined>,
) {
  return {
    selectedPackage: trimMetadataValue(payload.selectedPackage ?? sessionMetadata.selectedPackage),
    packageTitle: trimMetadataValue(payload.packageTitle ?? sessionMetadata.packageTitle),
    fullName: trimMetadataValue(payload.fullName ?? sessionMetadata.fullName),
    businessName: trimMetadataValue(payload.businessName ?? sessionMetadata.businessName),
    websiteUrl: trimMetadataValue(payload.websiteUrl ?? sessionMetadata.websiteUrl),
    emailAddress: trimMetadataValue(payload.emailAddress ?? sessionMetadata.emailAddress),
    whatsappNumber: trimMetadataValue(payload.whatsappNumber ?? sessionMetadata.whatsappNumber),
    whatsappConsent: trimMetadataValue(
      typeof payload.whatsappConsent === "boolean"
        ? String(payload.whatsappConsent)
        : payload.whatsappConsent ?? sessionMetadata.whatsappConsent,
    ),
    businessType: trimMetadataValue(payload.businessType ?? sessionMetadata.businessType),
    targetLocation: trimMetadataValue(payload.targetLocation ?? sessionMetadata.targetLocation),
    receiptCode: trimMetadataValue(payload.receiptCode ?? sessionMetadata.receiptCode),
  };
}

function buildBlogMetadata(
  payload: BlogMetadataRequest,
  sessionMetadata: Record<string, string | undefined>,
) {
  const preferredCTA = trimMetadataValue(payload.preferredCTA ?? sessionMetadata.preferredCTA);
  const customCTA = trimMetadataValue(payload.customCTA ?? sessionMetadata.customCTA);
  const ctaText = trimMetadataValue(
    preferredCTA === "Other CTA" && customCTA
      ? customCTA
      : payload.ctaText ?? sessionMetadata.ctaText ?? preferredCTA,
  );

  return {
    briefBusinessDescription: trimMetadataValue(
      payload.briefBusinessDescription ?? sessionMetadata.briefBusinessDescription,
    ),
    mainProductsServices: trimMetadataValue(
      payload.mainProductsServices ?? sessionMetadata.mainProductsServices,
    ),
    mainGoal: trimMetadataValue(payload.mainGoal ?? sessionMetadata.mainGoal),
    targetKeywords: trimMetadataValue(payload.targetKeywords ?? sessionMetadata.targetKeywords),
    targetLocation: trimMetadataValue(payload.targetLocation ?? sessionMetadata.targetLocation),
    primaryKeyword: trimMetadataValue(
      payload.primaryKeyword ?? sessionMetadata.primaryKeyword ?? payload.targetKeywords,
    ),
    secondaryKeywords: trimMetadataValue(payload.secondaryKeywords ?? sessionMetadata.secondaryKeywords),
    toneOfWriting: trimMetadataValue(payload.toneOfWriting ?? sessionMetadata.toneOfWriting),
    audienceShort: trimMetadataValue(payload.audienceShort ?? sessionMetadata.audienceShort),
    idealCustomers: trimMetadataValue(payload.idealCustomers ?? sessionMetadata.idealCustomers),
    topicsToCover: trimMetadataValue(payload.topicsToCover ?? sessionMetadata.topicsToCover),
    blogTopicIdeas: trimMetadataValue(
      payload.blogTopicIdeas ?? sessionMetadata.blogTopicIdeas ?? payload.topicsToCover,
    ),
    preferredCTA,
    customCTA,
    ctaText,
    pagesToPush: trimMetadataValue(payload.pagesToPush ?? sessionMetadata.pagesToPush),
    additionalNotes: trimMetadataValue(payload.additionalNotes ?? sessionMetadata.additionalNotes),
  };
}

function hasBlogBriefFields(metadata: ReturnType<typeof buildBlogMetadata>) {
  return Boolean(
    metadata.briefBusinessDescription &&
      metadata.mainProductsServices &&
      metadata.mainGoal &&
      metadata.targetKeywords &&
      metadata.targetLocation &&
      metadata.ctaText,
  );
}

export async function POST(request: Request) {
  logServerEvent("api.stripe.session-metadata", "request received", {
    ...getRequestDebugContext(request),
    ...getStripeEnvironmentSnapshot(),
  });

  let payload: BlogMetadataRequest;

  try {
    payload = (await request.json()) as BlogMetadataRequest;
  } catch {
    return Response.json({ error: "Invalid metadata payload." }, { status: 400 });
  }

  const sessionId = getStringParam(payload.sessionId);

  if (!sessionId) {
    return Response.json({ error: "Missing Stripe session id." }, { status: 400 });
  }

  try {
    const session = await stripeApiRequest<{
      mode?: string;
      payment_intent?: string | { id?: string };
      subscription?: string | { id?: string };
      status?: string;
      payment_status?: string;
      metadata?: Record<string, string | undefined>;
    }>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);

    if (!isPaidSession(session)) {
      return Response.json({ error: "Stripe session is not paid." }, { status: 403 });
    }

    const sessionMetadata = session.metadata ?? {};
    const orderFields = buildOrderMetadata(payload, sessionMetadata);
    const selectedPackage = orderFields.selectedPackage;

    if (selectedPackage !== "core" && selectedPackage !== "blog") {
      return Response.json({ error: "Please choose a valid package." }, { status: 400 });
    }

    const blogMetadata = buildBlogMetadata(payload, sessionMetadata);
    const isBlogPackage = selectedPackage === "blog";

    if (isBlogPackage && !hasBlogBriefFields(blogMetadata)) {
      return Response.json({ error: "Missing required blog brief metadata." }, { status: 400 });
    }

    const metadataFormData = new URLSearchParams();
    appendStripeMetadata(metadataFormData, "metadata", orderFields);
    if (isBlogPackage) {
      appendStripeMetadata(metadataFormData, "metadata", blogMetadata);
    }

    await stripeApiRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      body: metadataFormData,
    });

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId) {
      const paymentIntentFormData = new URLSearchParams();
      appendStripeMetadata(paymentIntentFormData, "metadata", orderFields);
      if (isBlogPackage) {
        appendStripeMetadata(paymentIntentFormData, "metadata", blogMetadata);
      }

      try {
        await stripeApiRequest(`/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
          method: "POST",
          body: paymentIntentFormData,
        });
      } catch (error) {
        logServerError("api.stripe.session-metadata", "payment intent metadata propagation failed", error, {
          sessionId,
          paymentIntentId,
          ...getStripeEnvironmentSnapshot(),
        });
      }
    }

    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (subscriptionId) {
      const subscriptionFormData = new URLSearchParams();
      appendStripeMetadata(subscriptionFormData, "metadata", orderFields);
      if (isBlogPackage) {
        appendStripeMetadata(subscriptionFormData, "metadata", blogMetadata);
      }

      try {
        await stripeApiRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
          method: "POST",
          body: subscriptionFormData,
        });
      } catch (error) {
        logServerError("api.stripe.session-metadata", "subscription metadata propagation failed", error, {
          sessionId,
          subscriptionId,
          ...getStripeEnvironmentSnapshot(),
        });
      }
    }

    logServerEvent("api.stripe.session-metadata", "metadata saved", {
      sessionId,
      selectedPackage,
      hasPaymentIntent: Boolean(paymentIntentId),
      hasSubscription: Boolean(subscriptionId),
      hasBlogBriefFields: isBlogPackage,
    });

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Stripe metadata.";

    logServerError("api.stripe.session-metadata", "metadata update failed", error, {
      sessionId,
      ...getStripeEnvironmentSnapshot(),
    });

    return Response.json({ error: message }, { status: 500 });
  }
}
