import { createStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getReceiptUrlFromCharge(
  charge: import("stripe").Stripe.Charge | string | null | undefined,
) {
  if (!charge || typeof charge === "string") {
    return null;
  }

  return charge.receipt_url ?? null;
}

async function resolveStripeReceiptUrl(sessionId: string) {
  const stripe = createStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.mode === "payment") {
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const receiptUrl = getReceiptUrlFromCharge(paymentIntent.latest_charge);

      if (receiptUrl) {
        return receiptUrl;
      }
    }
  }

  if (session.mode === "subscription") {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["latest_invoice"],
      });
      const latestInvoice = subscription.latest_invoice;

      if (latestInvoice && typeof latestInvoice !== "string") {
        if (latestInvoice.hosted_invoice_url) {
          return latestInvoice.hosted_invoice_url;
        }

        if (latestInvoice.invoice_pdf) {
          return latestInvoice.invoice_pdf;
        }
      }
    }
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = getStringParam(url.searchParams.get("session_id") ?? undefined);

  if (!sessionId) {
    return Response.json({ error: "Missing Stripe session id." }, { status: 400 });
  }

  try {
    const receiptUrl = await resolveStripeReceiptUrl(sessionId);

    if (!receiptUrl) {
      return Response.json(
        { error: "Stripe receipt could not be resolved for this payment." },
        { status: 404 },
      );
    }

    return Response.json({ receiptUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve Stripe receipt.";

    return Response.json({ error: message }, { status: 500 });
  }
}
