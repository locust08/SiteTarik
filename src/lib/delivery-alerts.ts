import "server-only";

import { isNotificationEmailConfigured, sendNotificationEmail } from "@/lib/notification-email";
import {
  buildBlogAlertEmail,
  buildCoreAlertEmail,
  buildStripeAlertCsv,
  buildStripeAlertRecord,
} from "@/lib/stripe-alerts";
import { resolveStripeReceiptAttachment } from "@/lib/stripe-receipts";
import { logServerEvent } from "@/lib/server-debug";

type StripeAlertSessionInput = Parameters<typeof buildStripeAlertRecord>[0];

type DeliveryAlertOptions = {
  idempotencyKey?: string;
  metadata?: Record<string, string | undefined>;
};

function sanitizeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function sendImmediateAlert(
  alertType: "core_paid" | "blog_brief_completed",
  session: StripeAlertSessionInput,
  options: DeliveryAlertOptions = {},
) {
  if (!isNotificationEmailConfigured()) {
    logServerEvent("delivery-alerts", "notification email not configured", {
      alertType,
      sessionId: session.id ?? "",
    });

    return { sent: false };
  }

  const record = buildStripeAlertRecord({
    ...session,
    metadata: {
      ...(session.metadata ?? {}),
      ...(options.metadata ?? {}),
    },
  });
  let receiptAttachment:
    | {
        filename: string;
        content: string;
        content_type?: string;
      }
    | null = null;
  let receiptUrl: string | null = null;

  try {
    const receipt = await resolveStripeReceiptAttachment(record.sessionId);
    receiptUrl = receipt.details.receiptUrl;
    receiptAttachment = receipt.attachment
      ? {
          filename: receipt.attachment.filename,
          content: receipt.attachment.content,
          content_type: receipt.attachment.mimeType,
        }
      : null;
  } catch (error) {
    logServerEvent("delivery-alerts", "receipt attachment unavailable", {
      alertType,
      sessionId: record.sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const email =
    alertType === "core_paid"
      ? buildCoreAlertEmail(record)
      : buildBlogAlertEmail(record, receiptUrl);
  const receiptCode = sanitizeFileSegment(record.receiptCode || record.sessionId || "stripe-alert");
  const filePrefix = alertType === "core_paid" ? "core-payment" : "seo-brief";
  const attachments = [
    {
      filename: `${filePrefix}-${receiptCode}.csv`,
      content: Buffer.from(buildStripeAlertCsv(record), "utf8").toString("base64"),
      content_type: "text/csv; charset=utf-8",
    },
    ...(receiptAttachment ? [receiptAttachment] : []),
  ];

  await sendNotificationEmail({
    subject: email.subject,
    text: email.text,
    html: email.html,
    idempotencyKey: options.idempotencyKey,
    attachments,
  });

  logServerEvent("delivery-alerts", "notification email sent", {
    alertType,
    sessionId: record.sessionId,
    receiptCode: record.receiptCode,
    whatsappNumber: record.whatsappNumber,
    hasReceiptAttachment: Boolean(receiptAttachment),
  });

  return { sent: true };
}

export function sendImmediateCorePaymentAlert(
  session: StripeAlertSessionInput,
  options?: DeliveryAlertOptions,
) {
  return sendImmediateAlert("core_paid", session, options);
}

export function sendImmediateBlogBriefAlert(
  session: StripeAlertSessionInput,
  options?: DeliveryAlertOptions,
) {
  return sendImmediateAlert("blog_brief_completed", session, options);
}
