import {
  siteTarikTrackingQueryKeys,
  type SiteTarikTrackingAttribution,
  type SiteTarikTrackingSnapshot,
} from "@/lib/tracking/types";

const maxPageHistoryEntries = 8;
const maxValueLength = 500;

function trimTrackingValue(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized.length > maxValueLength
    ? normalized.slice(0, maxValueLength)
    : normalized;
}

function getCanonicalPagePath(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function getCanonicalPageUrl(url: URL) {
  return url.toString();
}

function getTrackingSessionId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function extractTrackingAttribution(url: URL): SiteTarikTrackingAttribution {
  return siteTarikTrackingQueryKeys.reduce<SiteTarikTrackingAttribution>((accumulator, key) => {
    const value = trimTrackingValue(url.searchParams.get(key));

    if (value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

export function normalizePageHistory(pageHistory: string[], nextPageUrl: string) {
  const history = [...pageHistory];

  if (history[history.length - 1] !== nextPageUrl) {
    history.push(nextPageUrl);
  }

  return history.slice(-maxPageHistoryEntries);
}

export function createTrackingSnapshot(
  currentUrl: URL,
  referrer: string,
  existingSnapshot?: SiteTarikTrackingSnapshot | null,
) {
  const currentPageUrl = getCanonicalPageUrl(currentUrl);
  const currentPagePath = getCanonicalPagePath(currentUrl);
  const currentAttribution = extractTrackingAttribution(currentUrl);
  const trimmedReferrer = trimTrackingValue(referrer);

  if (!existingSnapshot) {
    return {
      tracking_session_id: getTrackingSessionId(),
      landing_page_url: currentPageUrl,
      landing_page_path: currentPagePath,
      page_url: currentPageUrl,
      page_path: currentPagePath,
      page_history: [currentPageUrl],
      referrer: trimmedReferrer,
      ...currentAttribution,
    } satisfies SiteTarikTrackingSnapshot;
  }

  const mergedSnapshot = mergeTrackingAttribution(existingSnapshot, currentAttribution);
  const landingPageUrl = existingSnapshot.landing_page_url || currentPageUrl;
  const landingPagePath = existingSnapshot.landing_page_path || currentPagePath;
  const pageHistory = normalizePageHistory(existingSnapshot.page_history, currentPageUrl);

  return {
    ...mergedSnapshot,
    tracking_session_id: existingSnapshot.tracking_session_id || getTrackingSessionId(),
    landing_page_url: landingPageUrl,
    landing_page_path: landingPagePath,
    page_url: currentPageUrl,
    page_path: currentPagePath,
    page_history: pageHistory,
    referrer: existingSnapshot.referrer || trimmedReferrer,
  } satisfies SiteTarikTrackingSnapshot;
}

export function mergeTrackingAttribution(
  existingSnapshot: SiteTarikTrackingSnapshot,
  currentAttribution: SiteTarikTrackingAttribution,
) {
  const merged = { ...existingSnapshot };

  for (const key of siteTarikTrackingQueryKeys) {
    const currentValue = trimTrackingValue(currentAttribution[key]);
    const existingValue = trimTrackingValue(existingSnapshot[key]);

    if (!existingValue && currentValue) {
      merged[key] = currentValue;
    }
  }

  return merged;
}

export function mergeTrackingSnapshot(
  existingSnapshot: SiteTarikTrackingSnapshot | null,
  currentUrl: URL,
  referrer: string,
) {
  const currentPageUrl = getCanonicalPageUrl(currentUrl);
  const currentPagePath = getCanonicalPagePath(currentUrl);
  const currentAttribution = extractTrackingAttribution(currentUrl);

  if (!existingSnapshot) {
    return createTrackingSnapshot(currentUrl, referrer, null);
  }

  const pageHistory = normalizePageHistory(existingSnapshot.page_history, currentPageUrl);
  const mergedSnapshot = mergeTrackingAttribution(existingSnapshot, currentAttribution);

  return {
    ...mergedSnapshot,
    landing_page_url: mergedSnapshot.landing_page_url || currentPageUrl,
    landing_page_path: mergedSnapshot.landing_page_path || currentPagePath,
    page_url: currentPageUrl,
    page_path: currentPagePath,
    page_history: pageHistory,
    referrer: mergedSnapshot.referrer || trimTrackingValue(referrer),
  } satisfies SiteTarikTrackingSnapshot;
}

export function serializeTrackingSnapshot(snapshot: SiteTarikTrackingSnapshot) {
  return JSON.stringify({
    tracking_session_id: snapshot.tracking_session_id,
    landing_page_url: snapshot.landing_page_url,
    landing_page_path: snapshot.landing_page_path,
    page_url: snapshot.page_url,
    page_path: snapshot.page_path,
    page_history: snapshot.page_history,
    referrer: snapshot.referrer,
    utm_source: snapshot.utm_source ?? "",
    utm_medium: snapshot.utm_medium ?? "",
    utm_campaign: snapshot.utm_campaign ?? "",
    utm_content: snapshot.utm_content ?? "",
    utm_term: snapshot.utm_term ?? "",
    gclid: snapshot.gclid ?? "",
    fbclid: snapshot.fbclid ?? "",
    msclkid: snapshot.msclkid ?? "",
    ttclid: snapshot.ttclid ?? "",
    click_id: snapshot.click_id ?? "",
  });
}

export function parseTrackingSnapshot(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SiteTarikTrackingSnapshot>;
    const trackingSessionId = trimTrackingValue(parsed.tracking_session_id);
    const landingPageUrl = trimTrackingValue(parsed.landing_page_url);
    const landingPagePath = trimTrackingValue(parsed.landing_page_path);
    const pageUrl = trimTrackingValue(parsed.page_url);
    const pagePath = trimTrackingValue(parsed.page_path);
    const referrer = trimTrackingValue(parsed.referrer);
    const pageHistory = Array.isArray(parsed.page_history)
      ? parsed.page_history.map((entry) => trimTrackingValue(entry)).filter(Boolean)
      : [];

    if (
      !trackingSessionId ||
      !landingPageUrl ||
      !landingPagePath ||
      !pageUrl ||
      !pagePath ||
      pageHistory.length === 0
    ) {
      return null;
    }

    return {
      tracking_session_id: trackingSessionId,
      landing_page_url: landingPageUrl,
      landing_page_path: landingPagePath,
      page_url: pageUrl,
      page_path: pagePath,
      page_history: pageHistory.slice(-maxPageHistoryEntries),
      referrer,
      utm_source: trimTrackingValue(parsed.utm_source),
      utm_medium: trimTrackingValue(parsed.utm_medium),
      utm_campaign: trimTrackingValue(parsed.utm_campaign),
      utm_content: trimTrackingValue(parsed.utm_content),
      utm_term: trimTrackingValue(parsed.utm_term),
      gclid: trimTrackingValue(parsed.gclid),
      fbclid: trimTrackingValue(parsed.fbclid),
      msclkid: trimTrackingValue(parsed.msclkid),
      ttclid: trimTrackingValue(parsed.ttclid),
      click_id: trimTrackingValue(parsed.click_id),
    } satisfies SiteTarikTrackingSnapshot;
  } catch {
    return null;
  }
}

export function snapshotToTrackingMetadata(snapshot: SiteTarikTrackingSnapshot) {
  return {
    tracking_session_id: snapshot.tracking_session_id,
    landing_page_url: snapshot.landing_page_url,
    landing_page_path: snapshot.landing_page_path,
    page_url: snapshot.page_url,
    page_path: snapshot.page_path,
    page_history: JSON.stringify(snapshot.page_history),
    referrer: snapshot.referrer,
    utm_source: snapshot.utm_source ?? "",
    utm_medium: snapshot.utm_medium ?? "",
    utm_campaign: snapshot.utm_campaign ?? "",
    utm_content: snapshot.utm_content ?? "",
    utm_term: snapshot.utm_term ?? "",
    gclid: snapshot.gclid ?? "",
    fbclid: snapshot.fbclid ?? "",
    msclkid: snapshot.msclkid ?? "",
    ttclid: snapshot.ttclid ?? "",
    click_id: snapshot.click_id ?? "",
  };
}

export function buildSiteTarikPageViewPayload(snapshot: SiteTarikTrackingSnapshot) {
  return {
    event: "site_tarik_page_view",
    tracking_session_id: snapshot.tracking_session_id,
    page_location: snapshot.page_url,
    page_path: snapshot.page_path,
    page_referrer: snapshot.referrer,
    landing_page_url: snapshot.landing_page_url,
    landing_page_path: snapshot.landing_page_path,
    page_history: JSON.stringify(snapshot.page_history),
    referrer: snapshot.referrer,
    utm_source: snapshot.utm_source ?? "",
    utm_medium: snapshot.utm_medium ?? "",
    utm_campaign: snapshot.utm_campaign ?? "",
    utm_content: snapshot.utm_content ?? "",
    utm_term: snapshot.utm_term ?? "",
    gclid: snapshot.gclid ?? "",
    fbclid: snapshot.fbclid ?? "",
    msclkid: snapshot.msclkid ?? "",
    ttclid: snapshot.ttclid ?? "",
    click_id: snapshot.click_id ?? "",
  };
}

export function buildSiteTarikCheckoutEventPayload(
  snapshot: SiteTarikTrackingSnapshot,
  extraFields: Record<string, string>,
) {
  return {
    event: "site_tarik_checkout_started",
    tracking_session_id: snapshot.tracking_session_id,
    page_location: snapshot.page_url,
    page_path: snapshot.page_path,
    page_referrer: snapshot.referrer,
    landing_page_url: snapshot.landing_page_url,
    landing_page_path: snapshot.landing_page_path,
    page_history: JSON.stringify(snapshot.page_history),
    referrer: snapshot.referrer,
    ...extraFields,
  };
}

export function buildSiteTarikSuccessPreparedPayload(
  snapshot: SiteTarikTrackingSnapshot,
  extraFields: Record<string, string> = {},
) {
  return {
    event: "site_tarik_success_prepared",
    tracking_session_id: snapshot.tracking_session_id,
    page_location: snapshot.page_url,
    page_path: snapshot.page_path,
    page_referrer: snapshot.referrer,
    landing_page_url: snapshot.landing_page_url,
    landing_page_path: snapshot.landing_page_path,
    page_history: JSON.stringify(snapshot.page_history),
    referrer: snapshot.referrer,
    ...extraFields,
  };
}
