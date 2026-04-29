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

type StripeMetadataValue = string | string[] | number | boolean | null | undefined;

type BlogMetadataRequest = {
  sessionId?: string;
  selectedPackage?: string;
  packageTitle?: string;
  fullName?: string;
  businessName?: string;
  websiteUrl?: string;
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
  orderDetails?: Record<string, StripeMetadataValue>;
  blogDetails?: Record<string, StripeMetadataValue>;
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

function getMetadataValue(
  payloadValue: StripeMetadataValue,
  sessionValue: string | undefined,
) {
  if (payloadValue === null || payloadValue === undefined) {
    return trimMetadataValue(sessionValue);
  }

  if (Array.isArray(payloadValue)) {
    return trimMetadataValue(payloadValue.join(", "));
  }

  return trimMetadataValue(String(payloadValue));
}

function isPaidSession(session: { status?: string; payment_status?: string }) {
  return session.status === "complete" && session.payment_status === "paid";
}

function buildOrderMetadata(
  payload: BlogMetadataRequest,
  sessionMetadata: Record<string, string | undefined>,
) {
  const orderDetails = payload.orderDetails ?? {};

  return {
    selectedPackage: getMetadataValue(
      payload.selectedPackage ?? orderDetails.selectedPackage,
      sessionMetadata.selectedPackage,
    ),
    packageTitle: getMetadataValue(
      payload.packageTitle ?? orderDetails.packageTitle,
      sessionMetadata.packageTitle,
    ),
    fullName: getMetadataValue(payload.fullName ?? orderDetails.fullName, sessionMetadata.fullName),
    businessName: getMetadataValue(
      payload.businessName ?? orderDetails.businessName,
      sessionMetadata.businessName,
    ),
    websiteUrl: getMetadataValue(payload.websiteUrl ?? orderDetails.websiteUrl, sessionMetadata.websiteUrl),
    whatsappNumber: getMetadataValue(
      payload.whatsappNumber ?? orderDetails.whatsappNumber,
      sessionMetadata.whatsappNumber,
    ),
    whatsappConsent: getMetadataValue(
      typeof payload.whatsappConsent !== "undefined"
        ? payload.whatsappConsent
        : orderDetails.whatsappConsent,
      sessionMetadata.whatsappConsent,
    ),
    businessType: getMetadataValue(
      payload.businessType ?? orderDetails.businessType,
      sessionMetadata.businessType,
    ),
    targetLocation: getMetadataValue(
      payload.targetLocation ?? orderDetails.targetLocation,
      sessionMetadata.targetLocation,
    ),
    receiptCode: getMetadataValue(
      payload.receiptCode ?? orderDetails.receiptCode,
      sessionMetadata.receiptCode,
    ),
  };
}

function buildBlogMetadata(
  payload: BlogMetadataRequest,
  sessionMetadata: Record<string, string | undefined>,
) {
  const blogDetails = payload.blogDetails ?? {};
  const preferredCTA = getMetadataValue(
    payload.preferredCTA ?? blogDetails.preferredCTA,
    sessionMetadata.preferredCTA,
  );
  const customCTA = getMetadataValue(
    payload.customCTA ?? blogDetails.customCTA,
    sessionMetadata.customCTA,
  );
  const ctaText = trimMetadataValue(
    preferredCTA === "Other CTA" && customCTA
      ? customCTA
      : getMetadataValue(payload.ctaText ?? blogDetails.ctaText, sessionMetadata.ctaText) || preferredCTA,
  );

  return {
    briefBusinessDescription: trimMetadataValue(
      getMetadataValue(
        payload.briefBusinessDescription ?? blogDetails.briefBusinessDescription,
        sessionMetadata.briefBusinessDescription,
      ),
    ),
    mainProductsServices: trimMetadataValue(
      getMetadataValue(
        payload.mainProductsServices ?? blogDetails.mainProductsServices,
        sessionMetadata.mainProductsServices,
      ),
    ),
    mainGoal: trimMetadataValue(getMetadataValue(payload.mainGoal ?? blogDetails.mainGoal, sessionMetadata.mainGoal)),
    targetKeywords: trimMetadataValue(
      getMetadataValue(payload.targetKeywords ?? blogDetails.targetKeywords, sessionMetadata.targetKeywords),
    ),
    targetLocation: trimMetadataValue(
      getMetadataValue(payload.targetLocation ?? blogDetails.targetLocation, sessionMetadata.targetLocation),
    ),
    primaryKeyword: trimMetadataValue(
      getMetadataValue(
        payload.primaryKeyword ?? blogDetails.primaryKeyword ?? payload.targetKeywords ?? blogDetails.targetKeywords,
        sessionMetadata.primaryKeyword,
      ),
    ),
    secondaryKeywords: trimMetadataValue(
      getMetadataValue(
        payload.secondaryKeywords ?? blogDetails.secondaryKeywords,
        sessionMetadata.secondaryKeywords,
      ),
    ),
    toneOfWriting: trimMetadataValue(
      getMetadataValue(payload.toneOfWriting ?? blogDetails.toneOfWriting, sessionMetadata.toneOfWriting),
    ),
    audienceShort: trimMetadataValue(
      getMetadataValue(payload.audienceShort ?? blogDetails.audienceShort, sessionMetadata.audienceShort),
    ),
    idealCustomers: trimMetadataValue(
      getMetadataValue(payload.idealCustomers ?? blogDetails.idealCustomers, sessionMetadata.idealCustomers),
    ),
    topicsToCover: trimMetadataValue(
      getMetadataValue(payload.topicsToCover ?? blogDetails.topicsToCover, sessionMetadata.topicsToCover),
    ),
    blogTopicIdeas: trimMetadataValue(
      getMetadataValue(
        payload.blogTopicIdeas ?? blogDetails.blogTopicIdeas ?? payload.topicsToCover ?? blogDetails.topicsToCover,
        sessionMetadata.blogTopicIdeas,
      ),
    ),
    preferredCTA,
    customCTA,
    ctaText,
    pagesToPush: trimMetadataValue(
      getMetadataValue(payload.pagesToPush ?? blogDetails.pagesToPush, sessionMetadata.pagesToPush),
    ),
    additionalNotes: trimMetadataValue(
      getMetadataValue(payload.additionalNotes ?? blogDetails.additionalNotes, sessionMetadata.additionalNotes),
    ),
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
