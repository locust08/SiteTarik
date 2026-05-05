import Stripe from "stripe";

import { sendImmediateCorePaymentAlert } from "@/lib/delivery-alerts";
import { getRequiredStripeSecretKey, getRequiredStripeWebhookSecret } from "@/lib/env";
import {
  getRequestDebugContext,
  logServerError,
  logServerEvent,
} from "@/lib/server-debug";
import { getStripeEnvironmentSnapshot } from "@/lib/stripe-rest";

export const runtime = "nodejs";

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getRequiredStripeSecretKey());
  }

  return stripeClient;
}

export async function POST(request: Request) {
  logServerEvent("api.stripe.webhook", "request received", {
    ...getRequestDebugContext(request),
    hasStripeSignature: Boolean(request.headers.get("stripe-signature")),
    ...getStripeEnvironmentSnapshot(),
  });

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      getRequiredStripeWebhookSecret(),
    );
  } catch (error) {
    logServerError("api.stripe.webhook", "signature verification failed", error, {
      ...getStripeEnvironmentSnapshot(),
    });

    return Response.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const selectedPackage = session.metadata?.selectedPackage?.trim() ?? "";

    if (
      selectedPackage === "core" &&
      session.status === "complete" &&
      session.payment_status === "paid"
    ) {
      try {
        await sendImmediateCorePaymentAlert(session, { idempotencyKey: event.id });
      } catch (error) {
        logServerError("api.stripe.webhook", "core payment alert failed", error, {
          eventId: event.id,
          sessionId: session.id,
          selectedPackage,
          ...getStripeEnvironmentSnapshot(),
        });
      }
    }
  }

  logServerEvent("api.stripe.webhook", "event processed", {
    eventId: event.id,
    eventType: event.type,
  });

  return Response.json({ received: true });
}
