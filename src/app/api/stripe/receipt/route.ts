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

function getReceiptUrlFromCharge(
  charge: { receipt_url?: string | null } | string | null | undefined,
) {
  if (!charge || typeof charge === "string") {
    return null;
  }

  return charge.receipt_url ?? null;
}

function getTimestampIso(timestamp?: number | null) {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function getStripeReceiptCode(
  metadataReceiptCode?: string | null,
  receiptNumber?: string | null,
  fallbackId?: string | null,
  fallbackSessionId?: string | null,
) {
  return (
    metadataReceiptCode?.trim() ||
    receiptNumber?.trim() ||
    fallbackId?.trim() ||
    fallbackSessionId?.trim() ||
    null
  );
}

async function resolveStripeReceiptDetails(sessionId: string) {
  const session = await stripeApiRequest<{
    mode?: string;
    payment_intent?: string | { id?: string };
    subscription?: string | { id?: string };
    metadata?: Record<string, string | undefined>;
  }>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  const metadataReceiptCode = session.metadata?.receiptCode ?? null;

  if (session.mode === "payment") {
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId) {
      const paymentIntent = await stripeApiRequest<{
        created?: number;
        metadata?: Record<string, string | undefined>;
        latest_charge?: { created?: number; receipt_url?: string | null; receipt_number?: string | null; id?: string } | string | null;
      }>(`/payment_intents/${encodeURIComponent(paymentIntentId)}?expand[]=latest_charge`);
      const receiptUrl = getReceiptUrlFromCharge(paymentIntent.latest_charge);
      const latestCharge =
        paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== "string"
          ? paymentIntent.latest_charge
          : null;
      const paidAtIso = getTimestampIso(latestCharge?.created ?? paymentIntent.created ?? null);
      const receiptCode = getStripeReceiptCode(
        paymentIntent.metadata?.receiptCode ?? metadataReceiptCode,
        latestCharge?.receipt_number,
        latestCharge?.id ?? paymentIntentId,
        sessionId,
      );

      if (receiptUrl) {
        return {
          receiptUrl,
          paidAtIso,
          receiptCode,
        };
      }
    }
  }

  if (session.mode === "subscription") {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (subscriptionId) {
      const subscription = await stripeApiRequest<{
        created?: number;
        metadata?: Record<string, string | undefined>;
        latest_invoice?: {
          created?: number;
          hosted_invoice_url?: string | null;
          invoice_pdf?: string | null;
          receipt_number?: string | null;
          number?: string | null;
          id?: string;
        } | string | null;
      }>(`/subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=latest_invoice`);
      const latestInvoice = subscription.latest_invoice;

      if (latestInvoice && typeof latestInvoice !== "string") {
        const paidAtIso = getTimestampIso(latestInvoice.created ?? subscription.created ?? null);
        const receiptCode = getStripeReceiptCode(
          subscription.metadata?.receiptCode ?? metadataReceiptCode,
          latestInvoice.receipt_number,
          latestInvoice.number ?? latestInvoice.id ?? subscriptionId,
          sessionId,
        );

        if (latestInvoice.hosted_invoice_url) {
          return {
            receiptUrl: latestInvoice.hosted_invoice_url,
            paidAtIso,
            receiptCode,
          };
        }

        if (latestInvoice.invoice_pdf) {
          return {
            receiptUrl: latestInvoice.invoice_pdf,
            paidAtIso,
            receiptCode,
          };
        }
      }
    }
  }

  return null;
}

async function resolveStripeSessionIdByEmail(email: string, selectedPackage?: string) {
  const sessions = await stripeApiRequest<{
    data?: Array<{
      id?: string;
      created?: number;
      mode?: string;
      payment_status?: string;
      status?: string;
      metadata?: { selectedPackage?: string };
    }>;
  }>(
    `/checkout/sessions?customer_details[email]=${encodeURIComponent(email)}&status=complete&limit=100`,
  );

  const matchingSession = (sessions.data ?? [])
    .filter((session) => session.payment_status === "paid" && session.status === "complete")
    .filter((session) =>
      selectedPackage ? session.metadata?.selectedPackage === selectedPackage : true,
    )
    .sort((a, b) => {
      const createdDiff = (b.created ?? 0) - (a.created ?? 0);

      if (createdDiff !== 0) {
        return createdDiff;
      }

      const aId = a.id ?? "";
      const bId = b.id ?? "";
      return bId.localeCompare(aId);
    })[0];

  if (!matchingSession?.id) {
    return null;
  }

  return matchingSession.id;
}

export async function GET(request: Request) {
  logServerEvent("api.stripe.receipt", "request received", {
    ...getRequestDebugContext(request),
    ...getStripeEnvironmentSnapshot(),
  });

  const url = new URL(request.url);
  const sessionId = getStringParam(url.searchParams.get("session_id") ?? undefined);
  const email = getStringParam(url.searchParams.get("email") ?? undefined);
  const selectedPackage = getStringParam(url.searchParams.get("selected_package") ?? undefined);
  const redirect = url.searchParams.get("redirect") === "1";

  try {
    const receiptDetails = sessionId
      ? await resolveStripeReceiptDetails(sessionId)
      : email
        ? await resolveStripeSessionIdByEmail(email, selectedPackage).then(async (resolvedSessionId) => {
            if (!resolvedSessionId) {
              return null;
            }

            return resolveStripeReceiptDetails(resolvedSessionId);
          })
        : null;
    const receiptUrl = receiptDetails?.receiptUrl ?? null;

    if (!receiptUrl) {
      logServerEvent("api.stripe.receipt", "receipt URL not found", {
        sessionId,
        email,
        selectedPackage,
      });

      if (redirect) {
        return new Response("Stripe receipt could not be resolved for this payment.", {
          status: 404,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      return Response.json(
        { error: "Stripe receipt could not be resolved for this payment." },
        { status: 404 },
      );
    }

    logServerEvent("api.stripe.receipt", "receipt URL resolved", {
      sessionId,
      email,
      hasReceiptUrl: true,
    });

    if (redirect) {
      return Response.redirect(receiptUrl, 302);
    }

    return Response.json({
      receiptUrl,
      paidAtIso: receiptDetails?.paidAtIso ?? null,
      receiptCode: receiptDetails?.receiptCode ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve Stripe receipt.";

    logServerError("api.stripe.receipt", "receipt lookup failed", error, {
      sessionId,
      email,
      selectedPackage,
      ...getStripeEnvironmentSnapshot(),
    });

    if (redirect) {
      return new Response(message, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
