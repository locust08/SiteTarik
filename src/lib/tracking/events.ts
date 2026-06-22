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
  "site_tarik_blog_card_click",
  "site_tarik_blog_cta_click",
  "site_tarik_navigation_click",
  "site_tarik_outbound_click",
  "site_tarik_whatsapp_click",
]);

function toGa4EventName(eventName: string) {
  if (eventName === "site_tarik_page_view") {
    return "page_view";
  }

  if (eventName === "site_tarik_package_selected") {
    return "package_selected";
  }

  if (eventName === "site_tarik_checkout_started") {
    return "begin_checkout";
  }

  if (eventName === "site_tarik_checkout_success") {
    return "purchase";
  }

  if (eventName === "site_tarik_blog_brief_submitted") {
    return "blog_brief_submitted";
  }

  if (eventName === "site_tarik_blog_card_click") {
    return "select_content";
  }

  if (eventName === "site_tarik_blog_cta_click") {
    return "blog_cta_click";
  }

  if (eventName === "site_tarik_navigation_click") {
    return "navigation_click";
  }

  if (eventName === "site_tarik_outbound_click") {
    return "outbound_click";
  }

  if (eventName === "site_tarik_whatsapp_click") {
    return "whatsapp_click";
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

    if (
      eventName !== "site_tarik_page_view" &&
      config.ga4MeasurementId &&
      typeof browserWindow.gtag === "function"
    ) {
      browserWindow.gtag("event", directGa4EventName, analyticsPayload);
    }

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
