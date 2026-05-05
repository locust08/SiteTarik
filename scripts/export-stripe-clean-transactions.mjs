import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Stripe from "stripe";

const defaultOutput = path.resolve("output", "stripe-clean-transactions.csv");
const allowedMetadataFields = [
  "selectedPackage",
  "receiptCode",
  "fullName",
  "businessName",
  "websiteUrl",
  "whatsappNumber",
  "businessType",
  "targetLocation",
  "briefBusinessDescription",
  "mainProductsServices",
  "mainGoal",
  "targetKeywords",
  "idealCustomers",
  "topicsToCover",
  "ctaText",
  "pagesToPush",
  "additionalNotes",
];

const outputColumns = [
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
  ...allowedMetadataFields,
];

const metadataFallbacks = {
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

function parseArgs(argv) {
  const options = {
    days: 90,
    output: defaultOutput,
    includeUnpaid: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--days") {
      options.days = Number(argv[index + 1] ?? options.days);
      index += 1;
      continue;
    }

    if (value === "--from") {
      options.from = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === "--to") {
      options.to = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === "--output") {
      options.output = path.resolve(argv[index + 1] ?? defaultOutput);
      index += 1;
      continue;
    }

    if (value === "--include-unpaid") {
      options.includeUnpaid = true;
    }
  }

  return options;
}

function isoToUnixSeconds(value, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const isoValue = endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
  const timestamp = Date.parse(isoValue);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid date: ${value}. Use YYYY-MM-DD.`);
  }

  return Math.floor(timestamp / 1000);
}

function buildCreatedFilter(options) {
  const gte = options.from
    ? isoToUnixSeconds(options.from)
    : Math.floor((Date.now() - options.days * 24 * 60 * 60 * 1000) / 1000);
  const lte = options.to ? isoToUnixSeconds(options.to, true) : undefined;

  return lte ? { gte, lte } : { gte };
}

function toUtcString(unixSeconds) {
  if (!unixSeconds) {
    return "";
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeCurrency(value) {
  return value ? String(value).toUpperCase() : "";
}

function normalizeAmount(value, currency) {
  if (typeof value !== "number") {
    return "";
  }

  const decimalAmount = value / 100;
  return currency
    ? new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(decimalAmount)
    : String(decimalAmount);
}

function getObjectId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.id ?? "";
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function toCsv(rows) {
  const header = outputColumns.map(csvEscape).join(",");
  const lines = rows.map((row) =>
    outputColumns.map((column) => csvEscape(row[column] ?? "")).join(","),
  );

  return [header, ...lines].join("\n");
}

function buildRow(session) {
  const metadata = session.metadata ?? {};
  const row = {
    sessionId: session.id ?? "",
    createdAtUtc: toUtcString(session.created),
    amountTotal: normalizeAmount(session.amount_total, session.currency),
    currency: normalizeCurrency(session.currency),
    status: session.status ?? "",
    paymentStatus: session.payment_status ?? "",
    mode: session.mode ?? "",
    customerEmail: session.customer_details?.email ?? session.customer_email ?? "",
    customerName: session.customer_details?.name ?? "",
    paymentIntentId: getObjectId(session.payment_intent),
    subscriptionId: getObjectId(session.subscription),
  };

  for (const field of allowedMetadataFields) {
    const candidates = metadataFallbacks[field] ?? [field];
    row[field] = candidates.map((key) => metadata[key] ?? "").find(Boolean) ?? "";
  }

  return row;
}

function shouldIncludeSession(session, includeUnpaid) {
  if (includeUnpaid) {
    return true;
  }

  return session.status === "complete" && session.payment_status === "paid";
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment.");
  }

  const options = parseArgs(process.argv.slice(2));
  const stripe = new Stripe(secretKey);
  const created = buildCreatedFilter(options);
  const sessions = [];

  for await (const session of stripe.checkout.sessions.list({
    limit: 100,
    created,
  })) {
    sessions.push(session);
  }

  sessions.sort((left, right) => (right.created ?? 0) - (left.created ?? 0));

  const rows = sessions
    .filter((session) => shouldIncludeSession(session, options.includeUnpaid))
    .map(buildRow);
  const csv = toCsv(rows);

  await fs.mkdir(path.dirname(options.output), { recursive: true });
  await fs.writeFile(options.output, csv, "utf8");

  console.log(`Exported ${rows.length} checkout sessions to ${options.output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
