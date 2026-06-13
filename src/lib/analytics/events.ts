/**
 * Analytics event taxonomy. Keep this list as the single source of truth so
 * event names stay consistent across client tracking, server actions and the
 * CartEvent table.
 */

export const ANALYTICS_EVENTS = [
  "page_view",
  "product_view",
  "add_to_cart",
  "begin_checkout",
  "checkout_success",
  "quiz_start",
  "quiz_complete",
  "newsletter_signup",
  "guide_view",
  "merchant_feed_view",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

export interface AnalyticsEvent {
  storeSlug: string;
  eventName: AnalyticsEventName;
  sessionId: string;
  payload?: Record<string, unknown>;
}
