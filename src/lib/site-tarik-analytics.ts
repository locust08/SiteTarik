import { readOptionalPublicEnvValue } from "@/lib/env.shared";

export const siteTarikTrackingCookieName = "siteTarikTracking";
export const siteTarikTrackingStorageKey = "siteTarikTrackingState";
export const siteTarikTrackingCookieMaxAgeSeconds = 60 * 60 * 24 * 90;

type SiteTarikAnalyticsRuntimeConfig = {
  ga4MeasurementId?: string;
  gtmId?: string;
};

declare global {
  interface Window {
    __SITE_TARIK_ANALYTICS__?: SiteTarikAnalyticsRuntimeConfig;
  }
}

function normalizeGtmId(value: string) {
  return /^GTM-[A-Z0-9]+$/i.test(value) ? value.toUpperCase() : "";
}

function normalizeGa4MeasurementId(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value) ? value.toUpperCase() : "";
}

function readBrowserAnalyticsConfig() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.__SITE_TARIK_ANALYTICS__ ?? null;
}

export function getSiteTarikAnalyticsConfig() {
  const browserConfig = readBrowserAnalyticsConfig();
  const gtmId = normalizeGtmId(
    readOptionalPublicEnvValue("NEXT_PUBLIC_GTM_ID") || browserConfig?.gtmId || "",
  );
  const ga4MeasurementId = normalizeGa4MeasurementId(
    readOptionalPublicEnvValue("NEXT_PUBLIC_GA4_MEASUREMENT_ID") ||
      browserConfig?.ga4MeasurementId ||
      "",
  );
  const hasGtm = gtmId.length > 0;
  const hasGa4 = ga4MeasurementId.length > 0;

  return {
    gtmId,
    ga4MeasurementId,
    hasGtm,
    hasGa4,
    shouldUseDirectGa4: !hasGtm && hasGa4,
  };
}
