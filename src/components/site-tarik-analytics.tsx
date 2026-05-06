"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  captureTrackingSnapshotFromBrowser,
} from "@/lib/tracking/browser";
import { pushSiteTarikPageView } from "@/lib/tracking/events";

export function SiteTarikAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedLocationRef = useRef("");
  const searchParamsString = searchParams?.toString() ?? "";

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

    pushSiteTarikPageView(snapshot);
  };

  useEffect(() => {
    recordCurrentLocation();
  }, [pathname, searchParamsString]);

  useEffect(() => {
    window.addEventListener("hashchange", recordCurrentLocation);
    window.addEventListener("popstate", recordCurrentLocation);

    return () => {
      window.removeEventListener("hashchange", recordCurrentLocation);
      window.removeEventListener("popstate", recordCurrentLocation);
    };
  }, []);

  return null;
}
