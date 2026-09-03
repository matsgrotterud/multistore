"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEventName } from "@/lib/analytics/events";
import { getCookieConsent } from "@/lib/consent";

/**
 * Fires page_view on every route change, plus an optional page-specific
 * event (product_view, guide_view, ...) passed by the page.
 */
export function PageViewTracker({
  storeSlug,
  extraEvent,
  extraPayload,
}: {
  storeSlug: string;
  extraEvent?: AnalyticsEventName;
  extraPayload?: Record<string, unknown>;
}) {
  const pathname = usePathname();
  const trackedKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${storeSlug}:${pathname}:${extraEvent ?? ""}`;
    const emit = () => {
      if (getCookieConsent()?.analytics !== true || trackedKey.current === key) return;
      track(storeSlug, "page_view", { path: pathname });
      if (extraEvent) {
        track(storeSlug, extraEvent, { path: pathname, ...extraPayload });
      }
      trackedKey.current = key;
    };
    emit();
    window.addEventListener("msdf-consent-changed", emit);
    return () => window.removeEventListener("msdf-consent-changed", emit);
    // extraPayload is intentionally not a dependency; it is stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug, pathname, extraEvent]);

  return null;
}
