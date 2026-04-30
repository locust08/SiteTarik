type StripeMetadataValue = string | string[] | number | boolean | null | undefined;

export const stripeOrderMetadataKeys = [
  "selectedPackage",
  "receiptCode",
  "fullName",
  "businessName",
  "websiteUrl",
  "whatsappNumber",
  "businessType",
  "targetLocation",
] as const;

export const stripeSeoMetadataKeys = [
  "briefBusinessDescription",
  "mainProductsServices",
  "mainGoal",
  "targetKeywords",
  "idealCustomers",
  "topicsToCover",
  "ctaText",
  "pagesToPush",
  "additionalNotes",
] as const;

export const stripeLegacyMetadataKeys = [
  "packageTitle",
  "whatsappConsent",
  "tracking_session_id",
  "landing_page_url",
  "landing_page_path",
  "page_url",
  "page_path",
  "page_history",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "msclkid",
  "ttclid",
  "click_id",
  "primaryKeyword",
  "secondaryKeywords",
  "toneOfWriting",
  "audienceShort",
  "blogTopicIdeas",
  "preferredCTA",
  "customCTA",
] as const;

export const stripeManagedMetadataKeys = [
  ...stripeOrderMetadataKeys,
  ...stripeSeoMetadataKeys,
  ...stripeLegacyMetadataKeys,
] as const;

function normalizeStripeMetadataValue(value: StripeMetadataValue) {
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");

    return joined.slice(0, 500);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().slice(0, 500);
}

export function prefixStripeMetadata(
  prefix: string,
  fields: Record<string, StripeMetadataValue>,
) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [`${prefix}${key}`, value]),
  ) as Record<string, StripeMetadataValue>;
}

export function appendStripeMetadata(
  formData: URLSearchParams,
  namespace: string,
  fields: Record<string, StripeMetadataValue>,
) {
  for (const [key, value] of Object.entries(fields)) {
    const normalizedValue = normalizeStripeMetadataValue(value);

    if (!normalizedValue) {
      continue;
    }

    formData.set(`${namespace}[${key}]`, normalizedValue);
  }
}

export function clearStripeMetadataKeys(
  formData: URLSearchParams,
  namespace: string,
  keys: readonly string[],
) {
  for (const key of keys) {
    formData.set(`${namespace}[${key}]`, "");
  }
}

export function replaceStripeMetadata(
  formData: URLSearchParams,
  namespace: string,
  fields: Record<string, StripeMetadataValue>,
  keysToClear: readonly string[],
) {
  clearStripeMetadataKeys(formData, namespace, keysToClear);
  appendStripeMetadata(formData, namespace, fields);
}

