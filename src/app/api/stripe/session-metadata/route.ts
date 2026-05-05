import {
  getStripeEnvironmentSnapshot,
  stripeApiRequest,
} from "@/lib/stripe-rest";
import { replaceStripeMetadata, stripeManagedMetadataKeys } from "@/lib/stripe-metadata";
import {
  getRequestDebugContext,
  logServerError,
  logServerEvent,
} from "@/lib/server-debug";
import { getSiteTarikPackageTitle } from "@/lib/order-flow";

type StripeMetadataValue = string | string[] | number | boolean | null | undefined;

type BlogMetadataRequest = {
  sessionId?: string;
  selectedPackage?: string;
  fullName?: string;
  businessName?: string;
  websiteUrl?: string;
  whatsappNumber?: string;
  businessType?: string;
  targetLocation?: string;
  briefBusinessDescription?: string;
  mainProductsServices?: string;
  mainGoal?: string;
  targetKeywords?: string;
  idealCustomers?: string;
  topicsToCover?: string;
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
  return value?.trim().slice(0, 500) ?? "";
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
  const sessionSelectedPackage = trimMetadataValue(sessionMetadata.selectedPackage);
  const fallbackSelectedPackage = trimMetadataValue(
    payload.selectedPackage ?? getStringParam(orderDetails.selectedPackage as string | string[] | undefined),
  );
  const resolvedSelectedPackage = sessionSelectedPackage || fallbackSelectedPackage;
  const packageTitle = trimMetadataValue(sessionMetadata.packageTitle) || getSiteTarikPackageTitle(resolvedSelectedPackage);

  return {
    selectedPackage: resolvedSelectedPackage,
    packageTitle,
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
    idealCustomers: trimMetadataValue(
      getMetadataValue(payload.idealCustomers ?? blogDetails.idealCustomers, sessionMetadata.idealCustomers),
    ),
    topicsToCover: trimMetadataValue(
      getMetadataValue(payload.topicsToCover ?? blogDetails.topicsToCover, sessionMetadata.topicsToCover),
    ),
    ctaText: trimMetadataValue(
      getMetadataValue(payload.ctaText ?? blogDetails.ctaText, sessionMetadata.ctaText),
    ),
    pagesToPush: trimMetadataValue(
      getMetadataValue(payload.pagesToPush ?? blogDetails.pagesToPush, sessionMetadata.pagesToPush),
    ),
    additionalNotes: trimMetadataValue(
      getMetadataValue(payload.additionalNotes ?? blogDetails.additionalNotes, sessionMetadata.additionalNotes),
    ),
  };
}

function hasBlogBriefFields(
  orderFields: ReturnType<typeof buildOrderMetadata>,
  metadata: ReturnType<typeof buildBlogMetadata>,
) {
  return Boolean(
    orderFields.targetLocation &&
    metadata.briefBusinessDescription &&
      metadata.mainProductsServices &&
      metadata.mainGoal &&
      metadata.targetKeywords &&
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
    const metadataToSave = isBlogPackage
      ? { ...orderFields, ...blogMetadata }
      : orderFields;

    if (isBlogPackage && !hasBlogBriefFields(orderFields, blogMetadata)) {
      return Response.json({ error: "Missing required blog brief metadata." }, { status: 400 });
    }

    const metadataFormData = new URLSearchParams();
    replaceStripeMetadata(metadataFormData, "metadata", metadataToSave, stripeManagedMetadataKeys);

    await stripeApiRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      body: metadataFormData,
    });

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId) {
      const paymentIntentFormData = new URLSearchParams();
      replaceStripeMetadata(
        paymentIntentFormData,
        "metadata",
        metadataToSave,
        stripeManagedMetadataKeys,
      );

      try {
        await stripeApiRequest(`/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
          method: "POST",
          body: paymentIntentFormData,
        });

        if (isBlogPackage) {
          const paymentIntent = await stripeApiRequest<{
            latest_charge?: { id?: string } | string | null;
          }>(`/payment_intents/${encodeURIComponent(paymentIntentId)}?expand[]=latest_charge`);
          const chargeId =
            paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== "string"
              ? paymentIntent.latest_charge.id
              : typeof paymentIntent.latest_charge === "string"
                ? paymentIntent.latest_charge
                : undefined;

          if (chargeId) {
            const chargeFormData = new URLSearchParams();
            replaceStripeMetadata(
              chargeFormData,
              "metadata",
              metadataToSave,
              stripeManagedMetadataKeys,
            );
            await stripeApiRequest(`/charges/${encodeURIComponent(chargeId)}`, {
              method: "POST",
              body: chargeFormData,
            });
          }
        }
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
      replaceStripeMetadata(
        subscriptionFormData,
        "metadata",
        metadataToSave,
        stripeManagedMetadataKeys,
      );

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
