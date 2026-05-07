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

type ResolveStripeReceiptEmailAssetsOptions = {
  maxAttempts?: number;
  retryDelayMs?: number;
  renderHtmlToPdf?: boolean;
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

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function isPdfReceipt(receiptUrl: string, contentType: string | null) {
  return Boolean(contentType?.includes("pdf") || /\.pdf(?:$|\?)/i.test(receiptUrl));
}

function isHtmlReceipt(receiptUrl: string, contentType: string | null) {
  return Boolean(
    contentType?.includes("html") ||
      /\.(?:html?)(?:$|\?)/i.test(receiptUrl) ||
      /\/invoice\//i.test(receiptUrl),
  );
}

async function renderReceiptUrlToPdf(receiptUrl: string) {
  // Avoid static bundler resolution so Cloudflare worker builds don't try to
  // package Playwright into the server runtime.
  const playwright = (await new Function(
    'return import("playwright")',
  )()) as typeof import("playwright");
  const launchers = [
    () => playwright.chromium.launch({ channel: "chrome", headless: true }),
    () => playwright.chromium.launch({ channel: "msedge", headless: true }),
    () => playwright.chromium.launch({ headless: true }),
  ];

  let lastError: unknown = null;

  for (const launch of launchers) {
    let browser: Awaited<ReturnType<typeof playwright.chromium.launch>> | null = null;

    try {
      browser = await launch();
      const page = await browser.newPage();
      await page.goto(receiptUrl, {
        waitUntil: "networkidle",
        timeout: 45_000,
      });
      await page.emulateMedia({ media: "screen" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "16px",
          right: "16px",
          bottom: "16px",
          left: "16px",
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      lastError = error;
    } finally {
      await browser?.close().catch(() => undefined);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Unable to launch a browser for Stripe receipt PDF rendering.");
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

export async function resolveStripeReceiptAttachment(
  sessionId: string,
  { renderHtmlToPdf = true }: { renderHtmlToPdf?: boolean } = {},
): Promise<{
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
  const fileBase = sanitizeFileSegment(details.receiptCode || sessionId || "stripe-receipt");

  if (isPdfReceipt(details.receiptUrl, contentType)) {
    const bytes = await response.arrayBuffer();

    return {
      details,
      attachment: {
        filename: `receipt-${fileBase}.pdf`,
        content: Buffer.from(bytes).toString("base64"),
        mimeType: "application/pdf",
      },
    };
  }

  if (renderHtmlToPdf && isHtmlReceipt(details.receiptUrl, contentType)) {
    const pdfBytes = await renderReceiptUrlToPdf(details.receiptUrl);

    return {
      details,
      attachment: {
        filename: `receipt-${fileBase}.pdf`,
        content: pdfBytes.toString("base64"),
        mimeType: "application/pdf",
      },
    };
  }

  return {
    details,
    attachment: null,
  };
}

export async function resolveStripeReceiptEmailAssets(
  sessionId: string,
  {
    maxAttempts = 1,
    retryDelayMs = 0,
    renderHtmlToPdf = true,
  }: ResolveStripeReceiptEmailAssetsOptions = {},
): Promise<{
  details: StripeReceiptDetails | null;
  attachment: StripeReceiptAttachment | null;
}> {
  let lastError: unknown = null;
  let lastDetails: StripeReceiptDetails | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const receipt = await resolveStripeReceiptAttachment(sessionId, {
        renderHtmlToPdf,
      });

      if (receipt.attachment) {
        return receipt;
      }

      lastDetails = receipt.details;
    } catch (error) {
      lastError = error;
    }

    try {
      const details = await resolveStripeReceiptDetails(sessionId);

      if (details?.receiptUrl) {
        lastDetails = details;
      }
    } catch (error) {
      lastError = lastError ?? error;
    }

    if (attempt < maxAttempts && retryDelayMs > 0) {
      await wait(retryDelayMs);
    }
  }

  if (lastDetails) {
    return {
      details: lastDetails,
      attachment: null,
    };
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Stripe receipt could not be resolved for this payment.");
}
