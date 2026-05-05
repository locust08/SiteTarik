import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import Stripe from "stripe";

const statePath = path.resolve("output", "stripe-alert-state.json");
const alertsDir = path.resolve("output", "stripe-alerts");
const lookbackDays = 365;
const orderMetadataFields = [
  "selectedPackage",
  "receiptCode",
  "fullName",
  "businessName",
  "websiteUrl",
  "whatsappNumber",
  "businessType",
  "targetLocation",
];
const blogMetadataFields = [
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
const allMetadataFields = [...orderMetadataFields, ...blogMetadataFields];
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
  ...allMetadataFields,
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

function toUtcString(unixSeconds) {
  if (!unixSeconds) {
    return "";
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeCurrency(value) {
  return value ? String(value).toUpperCase() : "";
}

function normalizeAmount(value) {
  if (typeof value !== "number") {
    return "";
  }

  return (value / 100).toFixed(2);
}

function getMetadataValue(metadata, field) {
  const candidates = metadataFallbacks[field] ?? [field];
  return candidates.map((key) => metadata[key] ?? "").find(Boolean) ?? "";
}

function hasRequiredBlogBrief(metadata) {
  return Boolean(
    getMetadataValue(metadata, "briefBusinessDescription") &&
      getMetadataValue(metadata, "mainProductsServices") &&
      getMetadataValue(metadata, "mainGoal") &&
      getMetadataValue(metadata, "targetKeywords") &&
      getMetadataValue(metadata, "targetLocation") &&
      getMetadataValue(metadata, "ctaText"),
  );
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  const header = csvColumns.map(csvEscape).join(",");
  const lines = rows.map((row) => csvColumns.map((column) => csvEscape(row[column] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

function buildRow(session) {
  const metadata = session.metadata ?? {};
  const row = {
    sessionId: session.id ?? "",
    createdAtUtc: toUtcString(session.created),
    amountTotal: normalizeAmount(session.amount_total),
    currency: normalizeCurrency(session.currency),
    status: session.status ?? "",
    paymentStatus: session.payment_status ?? "",
    mode: session.mode ?? "",
    customerEmail: session.customer_details?.email ?? session.customer_email ?? "",
    customerName: session.customer_details?.name ?? "",
  };

  for (const field of allMetadataFields) {
    row[field] = getMetadataValue(metadata, field);
  }

  return row;
}

async function readState() {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      sentEventKeys: Array.isArray(parsed.sentEventKeys) ? parsed.sentEventKeys : [],
    };
  } catch {
    return {
      sentEventKeys: [],
    };
  }
}

function sanitizeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment.");
  }

  const state = await readState();
  const sentEventKeys = new Set(state.sentEventKeys);
  const stripe = new Stripe(secretKey);
  const created = {
    gte: Math.floor((Date.now() - lookbackDays * 24 * 60 * 60 * 1000) / 1000),
  };
  const sessions = [];

  for await (const session of stripe.checkout.sessions.list({
    limit: 100,
    created,
  })) {
    sessions.push(session);
  }

  sessions.sort((left, right) => (left.created ?? 0) - (right.created ?? 0));

  const alerts = [];
  await fs.mkdir(alertsDir, { recursive: true });

  for (const session of sessions) {
    if (session.status !== "complete" || session.payment_status !== "paid") {
      continue;
    }

    const metadata = session.metadata ?? {};
    const selectedPackage = getMetadataValue(metadata, "selectedPackage");

    if (selectedPackage !== "core" && selectedPackage !== "blog") {
      continue;
    }

    const alertType =
      selectedPackage === "blog"
        ? hasRequiredBlogBrief(metadata)
          ? "blog_brief_completed"
          : null
        : "core_paid";

    if (!alertType) {
      continue;
    }

    const eventKey = `${alertType}:${session.id}`;

    if (sentEventKeys.has(eventKey)) {
      continue;
    }

    const row = buildRow(session);
    const attachmentPath = path.join(alertsDir, `${sanitizeFileName(eventKey)}.csv`);
    await fs.writeFile(attachmentPath, toCsv([row]), "utf8");

    alerts.push({
      eventKey,
      alertType,
      sessionId: session.id,
      attachmentPath,
      ...row,
    });
  }

  process.stdout.write(JSON.stringify({ alerts }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
