export const siteTarikTrackingCookieName = "siteTarikTracking";
export const siteTarikTrackingStorageKey = "siteTarikTrackingState";
export const siteTarikTrackingCookieMaxAgeSeconds = 60 * 60 * 24 * 90;

function readPublicEnvValue(name: string) {
  const value = globalThis.process?.env?.[name]?.trim();

  return value && value.length > 0 ? value : "";
}

export function getSiteTarikAnalyticsConfig() {
  const gtmId = readPublicEnvValue("NEXT_PUBLIC_GTM_ID");
  const ga4MeasurementId = readPublicEnvValue("NEXT_PUBLIC_GA4_MEASUREMENT_ID");

  return {
    gtmId,
    ga4MeasurementId,
    hasGtm: gtmId.length > 0,
    hasGa4: ga4MeasurementId.length > 0,
  };
}
