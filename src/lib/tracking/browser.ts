import {
  buildSiteTarikCheckoutEventPayload,
  buildSiteTarikPageViewPayload,
  mergeTrackingSnapshot,
  parseTrackingSnapshot,
  serializeTrackingSnapshot,
  snapshotToTrackingMetadata,
} from "@/lib/tracking/core";
import { pushSiteTarikEvent } from "@/lib/tracking/events";
import type { SiteTarikTrackingSnapshot } from "@/lib/tracking/types";
import {
  siteTarikTrackingCookieMaxAgeSeconds,
  siteTarikTrackingCookieName,
  siteTarikTrackingStorageKey,
} from "@/lib/site-tarik-analytics";

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

export function dispatchSiteTarikAnalyticsEvent(eventName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  pushSiteTarikEvent(eventName, payload);
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
