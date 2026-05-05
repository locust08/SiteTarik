import "server-only";

import { stripeApiRequest } from "@/lib/stripe-rest";

export type StripeReceiptDetails = {
  receiptUrl: string;
  paidAtIso: string | null;
  receiptCode: string | null;
};

export type StripeReceiptAttachment = {
  filename: string;
  content: string;
  mimeType?: string;
};

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

function sanitizeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function inferReceiptExtension(receiptUrl: string, contentType: string | null) {
  if (contentType?.includes("pdf") || /\.pdf(?:$|\?)/i.test(receiptUrl)) {
    return {
      extension: "pdf",
      mimeType: "application/pdf",
    };
  }

  if (contentType?.includes("html")) {
    return {
      extension: "html",
      mimeType: "text/html; charset=utf-8",
    };
  }

  return {
    extension: "txt",
    mimeType: "text/plain; charset=utf-8",
  };
}

export async function resolveStripeReceiptDetails(sessionId: string): Promise<StripeReceiptDetails | null> {
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
        latest_charge?: {
          created?: number;
          receipt_url?: string | null;
          receipt_number?: string | null;
          id?: string;
        } | string | null;
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

        if (latestInvoice.invoice_pdf) {
          return {
            receiptUrl: latestInvoice.invoice_pdf,
            paidAtIso,
            receiptCode,
          };
        }

        if (latestInvoice.hosted_invoice_url) {
          return {
            receiptUrl: latestInvoice.hosted_invoice_url,
            paidAtIso,
            receiptCode,
          };
        }
      }
    }
  }

  return null;
}

export async function resolveStripeSessionIdByEmail(
  email: string,
  selectedPackage?: string,
) {
  const sessions = await stripeApiRequest<{
    data?: Array<{
      id?: string;
      created?: number;
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

  return matchingSession?.id ?? null;
}

export async function resolveStripeReceiptAttachment(sessionId: string): Promise<{
  details: StripeReceiptDetails;
  attachment: StripeReceiptAttachment | null;
}> {
  const details = await resolveStripeReceiptDetails(sessionId);

  if (!details?.receiptUrl) {
    throw new Error("Stripe receipt could not be resolved for this payment.");
  }

  const response = await fetch(details.receiptUrl);

  if (!response.ok) {
    throw new Error(`Unable to download Stripe receipt (status ${response.status}).`);
  }

  const contentType = response.headers.get("content-type");
  const { extension, mimeType } = inferReceiptExtension(details.receiptUrl, contentType);
  const fileBase = sanitizeFileSegment(details.receiptCode || sessionId || "stripe-receipt");
  const bytes = await response.arrayBuffer();

  return {
    details,
    attachment: {
      filename: `receipt-${fileBase}.${extension}`,
      content: Buffer.from(bytes).toString("base64"),
      mimeType,
    },
  };
}
