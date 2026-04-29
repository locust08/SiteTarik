export const siteTarikTrackingQueryKeys = [
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
] as const;

export type SiteTarikTrackingQueryKey = (typeof siteTarikTrackingQueryKeys)[number];

export type SiteTarikTrackingAttribution = Partial<
  Record<SiteTarikTrackingQueryKey, string>
>;

export type SiteTarikTrackingSnapshot = SiteTarikTrackingAttribution & {
  tracking_session_id: string;
  landing_page_url: string;
  landing_page_path: string;
  page_url: string;
  page_path: string;
  page_history: string[];
  referrer: string;
};

export type SiteTarikTrackingEventPayload = SiteTarikTrackingSnapshot & {
  event: string;
  page_location: string;
  page_referrer: string;
};
