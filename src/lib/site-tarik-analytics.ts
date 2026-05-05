import { readOptionalPublicEnvValue } from "@/lib/env.shared";

export const siteTarikTrackingCookieName = "siteTarikTracking";
export const siteTarikTrackingStorageKey = "siteTarikTrackingState";
export const siteTarikTrackingCookieMaxAgeSeconds = 60 * 60 * 24 * 90;

export function getSiteTarikAnalyticsConfig() {
  const gtmId = readOptionalPublicEnvValue("NEXT_PUBLIC_GTM_ID");
  const ga4MeasurementId = readOptionalPublicEnvValue("NEXT_PUBLIC_GA4_MEASUREMENT_ID");

  return {
    gtmId,
    ga4MeasurementId,
    hasGtm: gtmId.length > 0,
    hasGa4: ga4MeasurementId.length > 0,
  };
}
