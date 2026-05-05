import "server-only";

import { readOptionalEnvValue } from "@/lib/env.shared";

type DeliveryMode = "dev" | "prod";

export type NotificationEmailAttachment = {
  filename: string;
  content: string;
  content_type?: string;
};

type NotificationEmailInput = {
  to?: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: NotificationEmailAttachment[];
  idempotencyKey?: string;
};

function getDeliveryMode(): DeliveryMode {
  const siteUrl = readOptionalEnvValue("NEXT_PUBLIC_SITE_URL");
  const stripeSecretKey = readOptionalEnvValue("STRIPE_SECRET_KEY");

  if (stripeSecretKey?.startsWith("sk_live_")) {
    return "prod";
  }

  if (!siteUrl) {
    return "dev";
  }

  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();

    return hostname === "localhost" || hostname === "127.0.0.1" ? "dev" : "prod";
  } catch {
    return "dev";
  }
}

function getNotificationEmailConfig() {
  const mode = getDeliveryMode();
  const from =
    readOptionalEnvValue("DELIVERY_ALERT_FROM_EMAIL") ??
    readOptionalEnvValue(mode === "prod" ? "RESEND_FROM_EMAIL_PROD" : "RESEND_FROM_EMAIL_DEV");
  const to =
    readOptionalEnvValue("DELIVERY_ALERT_TO_EMAIL") ??
    readOptionalEnvValue(mode === "prod" ? "RESEND_TO_EMAIL_PROD" : "RESEND_TO_EMAIL_DEV") ??
    "ava@locus-t.com.my";

  return {
    mode,
    apiKey: readOptionalEnvValue("RESEND_API_KEY"),
    from,
    to,
  };
}

export function isNotificationEmailConfigured() {
  const config = getNotificationEmailConfig();

  return Boolean(config.apiKey && config.from && config.to);
}

export async function sendNotificationEmail({
  to,
  subject,
  text,
  html,
  attachments = [],
  idempotencyKey,
}: NotificationEmailInput) {
  const config = getNotificationEmailConfig();

  if (!config.apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  if (!config.from) {
    throw new Error("Missing delivery alert sender email.");
  }

  const recipient = to ?? config.to;

  if (!recipient) {
    throw new Error("Missing delivery alert recipient email.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: config.from,
      to: [recipient],
      subject,
      text,
      html,
      attachments,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ??
        payload?.error?.message ??
        `Resend request failed with status ${response.status}.`,
    );
  }

  return payload;
}
