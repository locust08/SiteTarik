export const thankYouStorageKey = "siteTarikThankYouSubmission";
export const thankYouStoragePersistentKey = "siteTarikThankYouSubmissionPersistent";
export const thankYouStripeSessionKey = "siteTarikStripeSessionId";
export const thankYouStripeSessionPersistentKey = "siteTarikStripeSessionIdPersistent";
export const orderCompleteStorageKey = "siteTarikOrderComplete";
export const blogBriefSubmittedStorageKey = "siteTarikBlogBriefSubmitted";
export const siteTarikTimeZone = "Asia/Kuala_Lumpur";

export function getThankYouReceiptUrlKey(sessionId?: string | null) {
  return sessionId ? `siteTarikReceiptUrl:${sessionId}` : "siteTarikReceiptUrl";
}

export function formatSiteTarikDateTime(isoString: string) {
  const value = new Date(isoString);

  if (Number.isNaN(value.getTime())) {
    return "Not available";
  }

  const datePart = new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: siteTarikTimeZone,
  }).format(value);
  const timePart = new Intl.DateTimeFormat("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: siteTarikTimeZone,
  }).format(value);

  return `${datePart}, ${timePart} MYT`;
}

export function formatSiteTarikCompactDateTime(isoString: string) {
  const value = new Date(isoString);

  if (Number.isNaN(value.getTime())) {
    return "Not available";
  }

  const datePart = new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    timeZone: siteTarikTimeZone,
  }).format(value);
  const timePart = new Intl.DateTimeFormat("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: siteTarikTimeZone,
  }).format(value);

  return `${datePart}, ${timePart}`;
}

export function formatSiteTarikReceiptCode(
  sessionId?: string | null,
  selectedPackageValue?: string | null,
) {
  if (!sessionId) {
    return "ST-PENDING";
  }

  const packageCode = (selectedPackageValue ?? "ORDER").toUpperCase();
  const shortSessionId = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();

  return `ST-${packageCode}-${shortSessionId || "PENDING"}`;
}
