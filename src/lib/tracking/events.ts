import { getSiteTarikAnalyticsConfig } from "@/lib/site-tarik-analytics";
import {
  buildSiteTarikCheckoutEventPayload,
  buildSiteTarikPageViewPayload,
  buildSiteTarikSuccessPreparedPayload,
} from "@/lib/tracking/core";
import type { SiteTarikTrackingSnapshot } from "@/lib/tracking/types";

const siteTarikTrackedEventNames = new Set([
  "site_tarik_page_view",
  "site_tarik_package_selected",
  "site_tarik_checkout_started",
  "site_tarik_checkout_success",
  "site_tarik_blog_brief_submitted",
]);

function toGa4EventName(eventName: string) {
  if (eventName === "site_tarik_page_view") {
    return "page_view";
  }

  if (eventName === "site_tarik_package_selected") {
    return "site_tarik_package_selected";
  }

  if (eventName === "site_tarik_checkout_started") {
    return "begin_checkout";
  }

  if (eventName === "site_tarik_checkout_success") {
    return "purchase";
  }

  if (eventName === "site_tarik_blog_brief_submitted") {
    return "site_tarik_blog_brief_submitted";
  }

  return eventName;
}

export function pushSiteTarikEvent(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  if (!siteTarikTrackedEventNames.has(eventName)) {
    return;
  }

  const config = getSiteTarikAnalyticsConfig();
  const browserWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  };
  const analyticsPayload: Record<string, unknown> = { ...payload };
  const directGa4EventName = toGa4EventName(eventName);

  delete analyticsPayload.event;

  if (config.gtmId) {
    browserWindow.dataLayer = browserWindow.dataLayer ?? [];
    browserWindow.dataLayer.push({
      event: eventName,
      ...analyticsPayload,
    });
    return;
  }

  if (config.ga4MeasurementId && typeof browserWindow.gtag === "function") {
    browserWindow.gtag("event", directGa4EventName, analyticsPayload);
  }
}

export function pushSiteTarikPageView(snapshot: SiteTarikTrackingSnapshot) {
  const payload = buildSiteTarikPageViewPayload(snapshot);

  pushSiteTarikEvent(payload.event, payload);
}

export function pushSiteTarikCheckoutStarted(
  snapshot: SiteTarikTrackingSnapshot,
  extraFields: Record<string, string>,
) {
  const payload = buildSiteTarikCheckoutEventPayload(snapshot, extraFields);

  pushSiteTarikEvent(payload.event, payload);
}

export function getSiteTarikSuccessPreparedEvent(
  snapshot: SiteTarikTrackingSnapshot,
  extraFields: Record<string, string> = {},
) {
  return buildSiteTarikSuccessPreparedPayload(snapshot, extraFields);
}
