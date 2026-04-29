"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildBrowserPageViewEvent,
  captureTrackingSnapshotFromBrowser,
  dispatchSiteTarikAnalyticsEvent,
} from "@/lib/tracking/browser";

export function SiteTarikAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedLocationRef = useRef("");
  const searchParamsString = searchParams?.toString() ?? "";

  useEffect(() => {
    const recordCurrentLocation = () => {
      if (typeof window === "undefined") {
        return;
      }

      const currentLocation = window.location.href;

      if (lastTrackedLocationRef.current === currentLocation) {
        return;
      }

      const { snapshot, hasChanged } = captureTrackingSnapshotFromBrowser();

      lastTrackedLocationRef.current = currentLocation;

      if (!snapshot || !hasChanged) {
        return;
      }

      dispatchSiteTarikAnalyticsEvent(
        "site_tarik_page_view",
        buildBrowserPageViewEvent(snapshot),
      );
    };

    recordCurrentLocation();
  }, [pathname, searchParamsString]);

  useEffect(() => {
    const recordCurrentLocation = () => {
      if (typeof window === "undefined") {
        return;
      }

      const currentLocation = window.location.href;

      if (lastTrackedLocationRef.current === currentLocation) {
        return;
      }

      const { snapshot, hasChanged } = captureTrackingSnapshotFromBrowser();

      lastTrackedLocationRef.current = currentLocation;

      if (!snapshot || !hasChanged) {
        return;
      }

      dispatchSiteTarikAnalyticsEvent(
        "site_tarik_page_view",
        buildBrowserPageViewEvent(snapshot),
      );
    };

    window.addEventListener("hashchange", recordCurrentLocation);
    window.addEventListener("popstate", recordCurrentLocation);

    return () => {
      window.removeEventListener("hashchange", recordCurrentLocation);
      window.removeEventListener("popstate", recordCurrentLocation);
    };
  }, []);

  return null;
}
