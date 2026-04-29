import { getSiteTarikAnalyticsConfig } from "@/lib/site-tarik-analytics";
import {
  buildSiteTarikCheckoutEventPayload,
  buildSiteTarikPageViewPayload,
  buildSiteTarikSuccessPreparedPayload,
} from "@/lib/tracking/core";
import type { SiteTarikTrackingSnapshot } from "@/lib/tracking/types";

export function pushSiteTarikEvent(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const config = getSiteTarikAnalyticsConfig();
  const browserWindow = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  };
  const analyticsPayload: Record<string, unknown> = { ...payload };
  const directGa4EventName =
    eventName === "site_tarik_page_view"
      ? "page_view"
      : eventName === "site_tarik_checkout_started"
        ? "begin_checkout"
        : eventName;

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
