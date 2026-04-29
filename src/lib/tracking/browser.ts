import {
  buildSiteTarikCheckoutEventPayload,
  buildSiteTarikPageViewPayload,
  mergeTrackingSnapshot,
  parseTrackingSnapshot,
  serializeTrackingSnapshot,
  snapshotToTrackingMetadata,
} from "@/lib/tracking/core";
import type { SiteTarikTrackingSnapshot } from "@/lib/tracking/types";
import { getSiteTarikAnalyticsConfig } from "@/lib/site-tarik-analytics";
import {
  siteTarikTrackingCookieMaxAgeSeconds,
  siteTarikTrackingCookieName,
  siteTarikTrackingStorageKey,
} from "@/lib/site-tarik-analytics";

type BrowserTrackingWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
};

function getBrowserWindow() {
  return window as BrowserTrackingWindow;
}

function getStorageSnapshot() {
  try {
    const rawValue = window.sessionStorage.getItem(siteTarikTrackingStorageKey);

    if (rawValue) {
      return parseTrackingSnapshot(rawValue);
    }
  } catch {
    // Ignore storage access failures and fall back to cookies.
  }

  try {
    const match = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${siteTarikTrackingCookieName}=`));

    if (!match) {
      return null;
    }

    const rawValue = decodeURIComponent(match.slice(siteTarikTrackingCookieName.length + 1));

    return parseTrackingSnapshot(rawValue);
  } catch {
    return null;
  }
}

export function readTrackingSnapshotFromBrowser() {
  if (typeof window === "undefined") {
    return null;
  }

  return getStorageSnapshot();
}

export function persistTrackingSnapshot(snapshot: SiteTarikTrackingSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = serializeTrackingSnapshot(snapshot);

  try {
    window.sessionStorage.setItem(siteTarikTrackingStorageKey, serialized);
  } catch {
    // Ignore storage failures and keep the page usable.
  }

  try {
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = [
      `${siteTarikTrackingCookieName}=${encodeURIComponent(serialized)}`,
      "Path=/",
      `Max-Age=${siteTarikTrackingCookieMaxAgeSeconds}`,
      "SameSite=Lax",
      secureFlag,
    ]
      .filter(Boolean)
      .join("; ");
  } catch {
    // Ignore cookie write failures.
  }
}

export function captureTrackingSnapshotFromBrowser() {
  if (typeof window === "undefined") {
    return {
      snapshot: null,
      hasChanged: false,
    };
  }

  const currentUrl = new URL(window.location.href);
  const existingSnapshot = readTrackingSnapshotFromBrowser();
  const mergedSnapshot = mergeTrackingSnapshot(existingSnapshot, currentUrl, document.referrer);
  const hasChanged =
    serializeTrackingSnapshot(mergedSnapshot) !==
    (existingSnapshot ? serializeTrackingSnapshot(existingSnapshot) : "");

  if (hasChanged) {
    persistTrackingSnapshot(mergedSnapshot);
  }

  return {
    snapshot: mergedSnapshot,
    hasChanged,
  };
}

function dispatchDataLayerEvent(eventName: string, payload: Record<string, unknown>) {
  const browserWindow = getBrowserWindow();

  browserWindow.dataLayer = browserWindow.dataLayer ?? [];
  browserWindow.dataLayer.push({
    event: eventName,
    ...payload,
  });
}

function dispatchGtagEvent(eventName: string, payload: Record<string, unknown>) {
  const browserWindow = getBrowserWindow();

  if (typeof browserWindow.gtag !== "function") {
    return;
  }

  browserWindow.gtag("event", eventName, payload);
}

function getDirectGa4EventName(eventName: string) {
  if (eventName === "site_tarik_page_view") {
    return "page_view";
  }

  if (eventName === "site_tarik_checkout_started") {
    return "begin_checkout";
  }

  return eventName;
}

export function dispatchSiteTarikAnalyticsEvent(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const analyticsConfig = getSiteTarikAnalyticsConfig();
  const analyticsPayload: Record<string, unknown> = { ...payload };

  delete analyticsPayload.event;

  if (analyticsConfig.gtmId) {
    dispatchDataLayerEvent(eventName, analyticsPayload);
    return;
  }

  if (analyticsConfig.ga4MeasurementId) {
    dispatchGtagEvent(getDirectGa4EventName(eventName), analyticsPayload);
    return;
  }

  dispatchDataLayerEvent(eventName, analyticsPayload);
}

export function buildBrowserTrackingMetadata(snapshot: SiteTarikTrackingSnapshot) {
  return snapshotToTrackingMetadata(snapshot);
}

export function buildBrowserCheckoutEvent(
  snapshot: SiteTarikTrackingSnapshot,
  extraFields: Record<string, string>,
) {
  return buildSiteTarikCheckoutEventPayload(snapshot, extraFields);
}

export function buildBrowserPageViewEvent(snapshot: SiteTarikTrackingSnapshot) {
  return buildSiteTarikPageViewPayload(snapshot);
}
