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

function formatEmailValueHtml(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
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

type EmailSummaryCard = {
  label: string;
  value: string;
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

function getSectionItemValue(
  sections: EmailSection[],
  sectionTitle: string,
  itemLabel: string,
) {
  const section = sections.find((entry) => entry.title === sectionTitle);
  const item = section?.items.find((entry) => entry.label === itemLabel);

  return item?.value ?? "";
}

function buildEmailSummaryCards(sections: EmailSection[]) {
  const cards = [
    {
      label: "Package",
      value: getSectionItemValue(sections, "Order Info", "Package") || "Not available",
    },
    {
      label: "Amount",
      value: getSectionItemValue(sections, "Order Info", "Amount") || "Not available",
    },
    {
      label: "Receipt Code",
      value: getSectionItemValue(sections, "Order Info", "Receipt code") || "Not available",
    },
  ] satisfies EmailSummaryCard[];

  return cards;
}

function buildEmailHtml(heading: string, sections: EmailSection[]) {
  const summaryCards = buildEmailSummaryCards(sections);
  const summaryCardsHtml = summaryCards
    .map(
      (card) => `
        <td style="padding:0 8px 16px; vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; background:#fff7f7; border:1px solid #f0d4d6; border-radius:16px;">
            <tr>
              <td style="padding:16px 18px;">
                <div style="margin:0 0 8px; font-size:12px; line-height:16px; letter-spacing:0.08em; text-transform:uppercase; color:#8d5b60; font-weight:700;">
                  ${escapeHtml(card.label)}
                </div>
                <div style="margin:0; font-size:22px; line-height:28px; color:#111827; font-weight:800;">
                  ${escapeHtml(card.value)}
                </div>
              </td>
            </tr>
          </table>
        </td>`,
    )
    .join("");
  const sectionsHtml = sections
    .map(
      (section) => `
        <tr>
          <td style="padding:0 0 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;">
              <tr>
                <td style="padding:18px 20px 14px; border-bottom:1px solid #eef1f4;">
                  <div style="margin:0; font-size:16px; line-height:20px; color:#111827; font-weight:800; letter-spacing:0.02em;">
                    ${escapeHtml(section.title)}
                  </div>
                </td>
              </tr>
              ${section.items
                .map(
                  (item, index) => `
                    <tr>
                      <td align="left" width="190" style="padding:14px 22px 14px 20px; width:190px; font-size:13px; line-height:18px; color:#7b8794; font-weight:700; text-align:left !important; vertical-align:top; border-bottom:${index === section.items.length - 1 ? "0" : "1px solid #eef1f4"};">
                        ${escapeHtml(item.label)}
                      </td>
                      <td align="left" style="padding:14px 20px 14px 0; font-size:14px; line-height:21px; color:#111827; font-weight:${item.emphasize ? "800" : "500"}; text-align:left !important; vertical-align:top; word-break:normal; overflow-wrap:break-word; border-bottom:${index === section.items.length - 1 ? "0" : "1px solid #eef1f4"};">
                        <div align="left" style="margin:0; padding:0; text-align:left !important; word-break:normal; overflow-wrap:break-word;">${formatEmailValueHtml(item.value)}</div>
                      </td>
                    </tr>`,
                )
                .join("")}
            </table>
          </td>
        </tr>`,
    )
    .join("");

  return `
    <div style="margin:0; padding:24px 12px; background:#f4f5f7;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; margin:0 auto; max-width:760px; font-family:Manrope,Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; background:#ffffff; border-radius:24px; overflow:hidden;">
              <tr>
                <td style="padding:28px 32px; background-color:#521015; background:#521015; background-image:linear-gradient(135deg, #521015 0%, #3b0d12 32%, #221012 65%, #181113 100%); border-top:6px solid #ee2028;">
                  <div style="margin:0 0 14px; font-size:12px; line-height:16px; color:#ffe8eb; text-transform:uppercase; letter-spacing:0.12em; font-weight:700; font-family:Manrope,Arial,Helvetica,sans-serif;">
                    SiteTarik Order Delivery Summary
                  </div>
                  <div style="margin:0 0 12px; font-size:34px; line-height:40px; color:#ffffff; font-weight:800; font-family:Manrope,Arial,Helvetica,sans-serif;">
                    ${escapeHtml(heading)}
                  </div>
                  <div style="display:inline-block; padding:8px 14px; border:1px solid rgba(255,255,255,0.32); border-radius:999px; font-size:13px; line-height:18px; color:#fff3f4; font-weight:700; font-family:Manrope,Arial,Helvetica,sans-serif;">
                    Internal notification
                  </div>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding:28px 24px 10px; text-align:left;">
                  <div align="left" style="margin:0 0 22px; font-size:16px; line-height:26px; color:#344054; text-align:left !important;">
                    The order is ready for review. All delivery details are preserved below for fast action and handoff.
                  </div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      ${summaryCardsHtml}
                    </tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    ${sectionsHtml}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
        },
        {
          label: "Website URL",
          value: record.websiteUrl || "Not available",
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
