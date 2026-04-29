import {
  getStripeEnvironmentSnapshot,
  stripeApiRequest,
} from "@/lib/stripe-rest";
import {
  getRequestDebugContext,
  logServerError,
  logServerEvent,
} from "@/lib/server-debug";

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function trimMetadataValue(value: string | undefined) {
  return value?.trim().slice(0, 120) ?? "";
}

function getTimestampIso(timestamp?: number | null) {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

export async function GET(request: Request) {
  logServerEvent("api.stripe.verify", "request received", {
    ...getRequestDebugContext(request),
    ...getStripeEnvironmentSnapshot(),
  });

  const url = new URL(request.url);
  const sessionId = getStringParam(url.searchParams.get("session_id") ?? undefined);

  if (!sessionId) {
    logServerEvent("api.stripe.verify", "missing session id", getRequestDebugContext(request));

    return Response.json({ error: "Missing Stripe session id." }, { status: 400 });
  }

  try {
    const session = await stripeApiRequest<{
      mode?: string;
      payment_intent?: string | { id?: string };
      subscription?: string | { id?: string };
      payment_status?: string;
      status?: string;
      metadata?: Record<string, string | undefined>;
    }>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
    const metadata = session.metadata ?? {};
    const selectedPackage = trimMetadataValue(metadata.selectedPackage);
    const isPaid =
      session.status === "complete" &&
      session.payment_status === "paid" &&
      (selectedPackage === "blog" || selectedPackage === "core");
    const order = {
      selectedPackage,
      packageTitle: trimMetadataValue(metadata.packageTitle),
      fullName: trimMetadataValue(metadata.fullName),
      businessName: trimMetadataValue(metadata.businessName),
      websiteUrl: trimMetadataValue(metadata.websiteUrl),
      whatsappNumber: trimMetadataValue(metadata.whatsappNumber),
      whatsappConsent: trimMetadataValue(metadata.whatsappConsent),
      businessType: trimMetadataValue(metadata.businessType),
      targetLocation: trimMetadataValue(metadata.targetLocation),
      receiptCode: trimMetadataValue(metadata.receiptCode),
    };
    const blog = {
      mainGoal: trimMetadataValue(metadata.mainGoal),
      primaryKeyword: trimMetadataValue(metadata.primaryKeyword),
      secondaryKeywords: trimMetadataValue(metadata.secondaryKeywords),
      toneOfWriting: trimMetadataValue(metadata.toneOfWriting),
      audienceShort: trimMetadataValue(metadata.audienceShort),
      blogTopicIdeas: trimMetadataValue(metadata.blogTopicIdeas),
      ctaText: trimMetadataValue(metadata.ctaText),
      pagesToPush: trimMetadataValue(metadata.pagesToPush),
      additionalNotes: trimMetadataValue(metadata.additionalNotes),
    };
    const paidAtIso =
      session.mode === "payment"
        ? await (async () => {
            const paymentIntentId =
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

            if (!paymentIntentId) {
              return null;
            }

            const paymentIntent = await stripeApiRequest<{
              created?: number;
              latest_charge?: { created?: number } | string | null;
            }>(`/payment_intents/${encodeURIComponent(paymentIntentId)}?expand[]=latest_charge`);
            const latestCharge =
              paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== "string"
                ? paymentIntent.latest_charge
                : null;

            return getTimestampIso(latestCharge?.created ?? paymentIntent.created ?? null);
          })()
        : session.mode === "subscription"
          ? await (async () => {
              const subscriptionId =
                typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

              if (!subscriptionId) {
                return null;
              }

              const subscription = await stripeApiRequest<{
                created?: number;
                latest_invoice?: { created?: number } | string | null;
              }>(`/subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=latest_invoice`);
              const latestInvoice =
                subscription.latest_invoice && typeof subscription.latest_invoice !== "string"
                  ? subscription.latest_invoice
                  : null;

              return getTimestampIso(latestInvoice?.created ?? subscription.created ?? null);
            })()
          : null;

    logServerEvent("api.stripe.verify", "session verified", {
      sessionId,
      isPaid,
      selectedPackage,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
    });

    return Response.json({
      isPaid,
      mode: session.mode,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      selectedPackage,
      receiptCode: order.receiptCode,
      paidAtIso,
      order,
      blog,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify Stripe session.";

    logServerError("api.stripe.verify", "session verification failed", error, {
      sessionId,
      ...getStripeEnvironmentSnapshot(),
    });

    return Response.json({ error: message }, { status: 500 });
  }
}
