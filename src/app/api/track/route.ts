import { NextRequest, NextResponse } from "next/server";
import { isAnalyticsEvent } from "@/lib/analytics/events";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";
import { trackEventSchema } from "@/lib/validation/schemas";

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

  const { storeSlug, eventName, sessionId, payload } = parsed.data;

  if (process.env.NODE_ENV === "development") {
    console.info(`[track] ${storeSlug} ${eventName}`, payload);
  }

  try {
    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (store) {
      await prisma.cartEvent.create({
        data: {
          storeId: store.id,
          sessionId,
          eventName,
          payload: toJson(payload),
        },
      });
    }
  } catch (error) {
    console.error("failed to persist analytics event", error);
  }

  return NextResponse.json({ ok: true });
}
