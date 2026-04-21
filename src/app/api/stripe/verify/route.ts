import { createStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = getStringParam(url.searchParams.get("session_id") ?? undefined);

  if (!sessionId) {
    return Response.json({ error: "Missing Stripe session id." }, { status: 400 });
  }

  try {
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const selectedPackage = session.metadata?.selectedPackage ?? "";
    const isPaid =
      session.status === "complete" &&
      session.payment_status === "paid" &&
      (selectedPackage === "blog" || selectedPackage === "core");

    return Response.json({
      isPaid,
      mode: session.mode,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      selectedPackage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify Stripe session.";

    return Response.json({ error: message }, { status: 500 });
  }
}
