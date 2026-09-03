import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsEvent } from "@/lib/analytics/events";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";
import { trackEventSchema } from "@/lib/validation/schemas";
import {
  COOKIE_CONSENT_POLICY_VERSION,
  COOKIE_CONSENT_VERSION,
  isCurrentCookieConsentContract,
} from "@/lib/consent";
import { canAcceptTrackedTenant } from "@/lib/analytics/track-tenant";
import { resolveStoreSlugFromHostname } from "@/lib/tenant/resolve-tenant";

/**
 * First-party analytics sink. Validates the event, logs it in development
 * and persists it to the CartEvent table. Tracking failures always return
 * 2xx-ish silently from the client's perspective — analytics must never
 * break shopping.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success || !isAnalyticsEvent(parsed.data.eventName)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const {
    storeSlug,
    eventName,
    sessionId,
    consentVersion,
    consentPolicyVersion,
    payload,
  } = parsed.data;
  if (
    !isCurrentCookieConsentContract({
      version: consentVersion,
      policyVersion: consentPolicyVersion,
    })
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const production = process.env.NODE_ENV === "production";
  let resolvedHostStoreSlug: string | null = null;
  if (production) {
    try {
      resolvedHostStoreSlug = await resolveStoreSlugFromHostname(
        request.headers.get("host") ?? "",
        { requireLive: true, databaseAuthority: true }
      );
    } catch (error) {
      console.error("failed to bind analytics request to tenant host", error);
      return NextResponse.json({ ok: false }, { status: 503 });
    }
  }
  if (
    !canAcceptTrackedTenant({
      production,
      requestedStoreSlug: storeSlug,
      resolvedHostStoreSlug,
    })
  ) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  if (process.env.NODE_ENV === "development") {
    console.info(`[track] ${storeSlug} ${eventName}`, payload);
  }

  try {
    const store = await prisma.store.findFirst({
      where: { slug: storeSlug, isActive: true },
    });
    if (store) {
      await prisma.cartEvent.create({
        data: {
          storeId: store.id,
          sessionId,
          eventName,
          payload: toJson({
            ...payload,
            _consentVersion: COOKIE_CONSENT_VERSION,
            _consentPolicyVersion: COOKIE_CONSENT_POLICY_VERSION,
          }),
        },
      });
    }
  } catch (error) {
    console.error("failed to persist analytics event", error);
  }

  return NextResponse.json({ ok: true });
}
