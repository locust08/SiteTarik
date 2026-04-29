import {
  parseTrackingSnapshot,
  snapshotToTrackingMetadata,
} from "@/lib/tracking/core";
import type { SiteTarikTrackingSnapshot } from "@/lib/tracking/types";
import { siteTarikTrackingCookieName } from "@/lib/site-tarik-analytics";

function readCookieValue(cookieHeader: string | null, cookieName: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(";")) {
    const trimmedEntry = entry.trim();

    if (!trimmedEntry.startsWith(`${cookieName}=`)) {
      continue;
    }

    return decodeURIComponent(trimmedEntry.slice(cookieName.length + 1));
  }

  return null;
}

export function readTrackingSnapshotFromRequest(request: Request): SiteTarikTrackingSnapshot | null {
  const cookieHeader = request.headers.get("cookie");
  const rawValue = readCookieValue(cookieHeader, siteTarikTrackingCookieName);

  return parseTrackingSnapshot(rawValue);
}

export function buildRequestTrackingMetadata(request: Request) {
  const snapshot = readTrackingSnapshotFromRequest(request);

  return snapshot ? snapshotToTrackingMetadata(snapshot) : null;
}
