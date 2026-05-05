import {
  getStripeEnvironmentSnapshot,
} from "@/lib/stripe-rest";
import {
  resolveStripeReceiptDetails,
  resolveStripeSessionIdByEmail,
} from "@/lib/stripe-receipts";
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
