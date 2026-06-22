"use client";

import Link, { type LinkProps } from "next/link";
import type { MouseEvent, ReactNode } from "react";
import {
  buildBrowserTrackingMetadata,
  captureTrackingSnapshotFromBrowser,
  dispatchSiteTarikAnalyticsEvent,
} from "@/lib/tracking/browser";

type TrackedLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> &
  LinkProps & {
    children: ReactNode;
    trackingEvent: string;
    trackingLabel?: string;
    trackingLocation?: string;
    trackingPayload?: Record<string, unknown>;
  };

function getHrefString(href: LinkProps["href"]) {
  if (typeof href === "string") {
    return href;
  }

  const pathname = href.pathname ?? "";
  const query = href.query
    ? `?${new URLSearchParams(
        Object.entries(href.query).reduce<Record<string, string>>((accumulator, [key, value]) => {
          if (typeof value === "string") {
            accumulator[key] = value;
          }

          return accumulator;
        }, {}),
      ).toString()}`
    : "";
  const hash = href.hash ?? "";

  return `${pathname}${query}${hash}`;
}

function isOutboundHref(href: string) {
  if (typeof window === "undefined") {
    return /^https?:\/\//i.test(href);
  }

  try {
    const url = new URL(href, window.location.href);

    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function TrackedLink({
  children,
  href,
  onClick,
  trackingEvent,
  trackingLabel,
  trackingLocation,
  trackingPayload,
  ...props
}: TrackedLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const hrefString = getHrefString(href);
    const { snapshot } = captureTrackingSnapshotFromBrowser();

    dispatchSiteTarikAnalyticsEvent(trackingEvent, {
      ...(snapshot ? buildBrowserTrackingMetadata(snapshot) : {}),
      link_url: hrefString,
      link_text: trackingLabel ?? props.title ?? "",
      link_location: trackingLocation ?? "",
      outbound: isOutboundHref(hrefString),
      ...trackingPayload,
    });
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
