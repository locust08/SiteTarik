import { readOptionalPublicEnvValue } from "@/lib/env.shared";

export const siteTarikTrackingCookieName = "siteTarikTracking";
export const siteTarikTrackingStorageKey = "siteTarikTrackingState";
export const siteTarikTrackingCookieMaxAgeSeconds = 60 * 60 * 24 * 90;

function normalizeGtmId(value: string) {
  return /^GTM-[A-Z0-9]+$/i.test(value) ? value.toUpperCase() : "";
}

function normalizeGa4MeasurementId(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value) ? value.toUpperCase() : "";
}

export function getSiteTarikAnalyticsConfig() {
  const gtmId = normalizeGtmId(readOptionalPublicEnvValue("NEXT_PUBLIC_GTM_ID"));
  const ga4MeasurementId = normalizeGa4MeasurementId(
    readOptionalPublicEnvValue("NEXT_PUBLIC_GA4_MEASUREMENT_ID"),
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
