import { getSiteTarikPackageTitle } from "@/lib/order-flow";
import { stripeOrderMetadataKeys, stripeSeoMetadataKeys } from "@/lib/stripe-metadata";

type StripeAlertField =
  | (typeof stripeOrderMetadataKeys)[number]
  | (typeof stripeSeoMetadataKeys)[number];

type MetadataRecord = Record<string, string | null | undefined>;

type StripeAlertSessionLike = {
  id?: string | null;
  created?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  status?: string | null;
  payment_status?: string | null;
  mode?: string | null;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
  } | null;
  payment_intent?: string | { id?: string | null } | null;
  subscription?: string | { id?: string | null } | null;
  metadata?: MetadataRecord | null;
};

export type StripeAlertRecord = {
  sessionId: string;
  createdAtUtc: string;
  amountTotal: string;
  currency: string;
  status: string;
  paymentStatus: string;
  mode: string;
  customerEmail: string;
  customerName: string;
  paymentIntentId: string;
  subscriptionId: string;
} & Record<StripeAlertField, string>;

const stripeAlertFields = [...stripeOrderMetadataKeys, ...stripeSeoMetadataKeys] as const;

const csvColumns = [
  "sessionId",
  "createdAtUtc",
  "amountTotal",
  "currency",
  "status",
  "paymentStatus",
  "mode",
  "customerEmail",
  "customerName",
  "paymentIntentId",
  "subscriptionId",
  ...stripeAlertFields,
] as const;

const metadataFallbacks: Record<StripeAlertField, readonly string[]> = {
  selectedPackage: ["selectedPackage", "order_selectedPackage"],
  receiptCode: ["receiptCode", "order_receiptCode"],
  fullName: ["fullName", "order_fullName"],
  businessName: ["businessName", "order_businessName"],
  websiteUrl: ["websiteUrl", "order_websiteUrl"],
  whatsappNumber: ["whatsappNumber", "order_whatsappNumber"],
  businessType: ["businessType", "order_businessType"],
  targetLocation: ["targetLocation", "order_targetLocation", "blog_targetLocation"],
  briefBusinessDescription: ["briefBusinessDescription", "blog_briefBusinessDescription"],
  mainProductsServices: ["mainProductsServices", "blog_mainProductsServices"],
  mainGoal: ["mainGoal", "blog_mainGoal"],
  targetKeywords: ["targetKeywords", "blog_targetKeywords"],
  idealCustomers: ["idealCustomers", "blog_idealCustomers"],
  topicsToCover: ["topicsToCover", "blog_topicsToCover", "blog_blogTopicIdeas", "blogTopicIdeas"],
  ctaText: ["ctaText", "blog_ctaText", "preferredCTA", "customCTA"],
  pagesToPush: ["pagesToPush", "blog_pagesToPush"],
  additionalNotes: ["additionalNotes", "blog_additionalNotes"],
};

function trimAlertValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function toUtcString(unixSeconds?: number | null) {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) {
    return "";
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeCurrency(value: string | null | undefined) {
  return value ? value.toUpperCase() : "";
}

function normalizeAmount(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "";
  }

  return (value / 100).toFixed(2);
}

function getObjectId(value: string | { id?: string | null } | null | undefined) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : trimAlertValue(value.id);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getMetadataValue(metadata: MetadataRecord, field: StripeAlertField) {
  const candidates = metadataFallbacks[field] ?? [field];

  for (const key of candidates) {
    const value = trimAlertValue(metadata[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

type EmailSection = {
  title: string;
  items: Array<{
    label: string;
    value: string;
    emphasize?: boolean;
  }>;
};

function buildEmailText(heading: string, sections: EmailSection[]) {
  const lines = [heading, ""];

  for (const section of sections) {
    lines.push(`${section.title}:`);

    for (const item of section.items) {
      lines.push(`${item.label}: ${item.value}`);
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function buildEmailHtml(heading: string, sections: EmailSection[]) {
  const sectionsHtml = sections
    .map(
      (section) => `
        <section style="margin:0 0 18px;">
          <h2 style="margin:0 0 8px;font-size:16px;">${escapeHtml(section.title)}</h2>
          ${section.items
            .map(
              (item) => `
                <p style="margin:0 0 6px;">
                  <strong>${escapeHtml(item.label)}:</strong>
                  ${
                    item.emphasize
                      ? `<strong>${escapeHtml(item.value)}</strong>`
                      : escapeHtml(item.value)
                  }
                </p>`,
            )
            .join("")}
        </section>`,
    )
    .join("");

  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">
    <p style="margin:0 0 16px;font-size:16px;"><strong>${escapeHtml(heading)}</strong></p>
    ${sectionsHtml}
  </div>`;
}

function getBaseEmailSections(
  record: StripeAlertRecord,
  receiptUrl?: string | null,
) {
  const packageLabel = getSiteTarikPackageTitle(record.selectedPackage);
  const whatsappNumber =
    record.whatsappNumber || "MISSING - CHECK STRIPE / CONTACT CUSTOMER ANOTHER WAY";

  return [
    {
      title: "Delivery Info",
      items: [
        {
          label: "WhatsApp for delivery",
          value: whatsappNumber,
          emphasize: true,
        },
        {
          label: "Website URL",
          value: record.websiteUrl || "Not available",
          emphasize: true,
        },
        {
          label: "Business name",
          value: record.businessName || "Not available",
        },
        {
          label: "Full name",
          value: record.fullName || "Not available",
        },
      ],
    },
    {
      title: "Order Info",
      items: [
        {
          label: "Receipt code",
          value: record.receiptCode || "Not available",
        },
        {
          label: "Target location",
          value: record.targetLocation || "Not available",
        },
        {
          label: "Business type",
          value: record.businessType || "Not available",
        },
        {
          label: "Amount",
          value: record.amountTotal ? `${record.amountTotal} ${record.currency}` : "Not available",
        },
        {
          label: "Package",
          value: packageLabel,
        },
        ...(receiptUrl
          ? [
              {
                label: "Stripe receipt",
                value: receiptUrl,
              },
            ]
          : []),
      ],
    },
  ] satisfies EmailSection[];
}

export function hasCompletedBlogBrief(metadata: MetadataRecord) {
  return Boolean(
    getMetadataValue(metadata, "briefBusinessDescription") &&
      getMetadataValue(metadata, "mainProductsServices") &&
      getMetadataValue(metadata, "mainGoal") &&
      getMetadataValue(metadata, "targetKeywords") &&
      getMetadataValue(metadata, "targetLocation") &&
      getMetadataValue(metadata, "ctaText"),
  );
}

export function buildStripeAlertRecord(session: StripeAlertSessionLike): StripeAlertRecord {
  const metadata = session.metadata ?? {};
  const record = {
    sessionId: trimAlertValue(session.id),
    createdAtUtc: toUtcString(session.created),
    amountTotal: normalizeAmount(session.amount_total),
    currency: normalizeCurrency(session.currency),
    status: trimAlertValue(session.status),
    paymentStatus: trimAlertValue(session.payment_status),
    mode: trimAlertValue(session.mode),
    customerEmail: trimAlertValue(session.customer_details?.email) || trimAlertValue(session.customer_email),
    customerName: trimAlertValue(session.customer_details?.name),
    paymentIntentId: getObjectId(session.payment_intent),
    subscriptionId: getObjectId(session.subscription),
  } as StripeAlertRecord;

  for (const field of stripeAlertFields) {
    record[field] = getMetadataValue(metadata, field);
  }

  return record;
}

export function buildStripeAlertCsv(record: StripeAlertRecord) {
  const header = csvColumns.map((column) => csvEscape(column)).join(",");
  const row = csvColumns.map((column) => csvEscape(record[column] ?? "")).join(",");

  return [header, row].join("\n");
}

export function buildCoreAlertEmail(
  record: StripeAlertRecord,
  receiptUrl?: string | null,
) {
  const subject = [
    "Core Reborn paid",
    record.businessName || record.fullName || "New order",
    record.whatsappNumber || "WhatsApp missing",
    record.receiptCode || "No receipt",
  ].join(" | ");
  const heading = "A new Core Reborn payment is ready for delivery.";
  const sections = getBaseEmailSections(record, receiptUrl);

  return {
    subject,
    text: buildEmailText(heading, sections),
    html: buildEmailHtml(heading, sections),
  };
}

export function buildBlogAlertEmail(
  record: StripeAlertRecord,
  receiptUrl?: string | null,
) {
  const subject = [
    "SEO brief submitted",
    record.businessName || record.fullName || "New order",
    record.whatsappNumber || "WhatsApp missing",
    record.receiptCode || "No receipt",
  ].join(" | ");
  const heading = "A new SEO Enhancement brief is ready for delivery.";
  const sections = [
    ...getBaseEmailSections(record, receiptUrl),
    {
      title: "SEO Brief",
      items: [
        {
          label: "Business description",
          value: record.briefBusinessDescription || "Not available",
          emphasize: true,
        },
        {
          label: "Products and services",
          value: record.mainProductsServices || "Not available",
        },
        {
          label: "Main goal",
          value: record.mainGoal || "Not available",
          emphasize: true,
        },
        {
          label: "Target keywords",
          value: record.targetKeywords || "Not available",
          emphasize: true,
        },
        {
          label: "Ideal customers",
          value: record.idealCustomers || "Not available",
        },
        {
          label: "Topics to cover",
          value: record.topicsToCover || "Not available",
        },
        {
          label: "CTA text",
          value: record.ctaText || "Not available",
          emphasize: true,
        },
        {
          label: "Pages to push",
          value: record.pagesToPush || "Not available",
        },
        {
          label: "Additional notes",
          value: record.additionalNotes || "Not available",
        },
      ],
    },
  ] satisfies EmailSection[];

  return {
    subject,
    text: buildEmailText(heading, sections),
    html: buildEmailHtml(heading, sections),
  };
}
