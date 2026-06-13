"use client";

import type { AnalyticsEventName } from "@/lib/analytics/events";
import { getCookieConsent } from "@/lib/consent";

/**
 * Client-side tracking. Events are logged to the console in development and
 * POSTed to /api/track, which persists them as CartEvent rows.
 *
 * Consent rules: page_view and commerce funnel events are first-party,
 * cookieless analytics (necessary for operating the shop). Anything that
 * would feed marketing tools must check `analytics` consent first — the
 * gate below blocks all network tracking until the visitor has decided,
 * keeping the default behavior conservative.
 */

const SESSION_KEY = "msdf_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let sessionId = window.sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function track(
  storeSlug: string,
  eventName: AnalyticsEventName,
  payload: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  const event = {
    storeSlug,
    eventName,
    sessionId: getSessionId(),
    payload,
  };

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info("[analytics]", eventName, event);
  }

  const consent = getCookieConsent();
  if (consent?.analytics !== true) {
    // Visitor declined (or hasn't decided): keep the event local only.
    return;
  }

  const body = JSON.stringify(event);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* tracking must never break the storefront */
    });
  }
}
