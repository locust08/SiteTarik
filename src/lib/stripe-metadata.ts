type StripeMetadataValue = string | string[] | number | boolean | null | undefined;

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

