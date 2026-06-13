"use server";

import { prisma } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation/schemas";
import { toJson } from "@/lib/utils/json";

export interface NewsletterResult {
  ok: boolean;
  message: string;
}

export async function subscribeToNewsletter(
  input: unknown
): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const store = await prisma.store.findUnique({
    where: { slug: parsed.data.storeSlug },
  });
  if (!store) {
    return { ok: false, message: "Unknown store" };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: {
        storeId_email: { storeId: store.id, email: parsed.data.email.toLowerCase() },
      },
      create: {
        storeId: store.id,
        email: parsed.data.email.toLowerCase(),
        source: parsed.data.source,
        preferences: parsed.data.preferences
          ? toJson(parsed.data.preferences)
          : null,
      },
      update: { source: parsed.data.source },
    });

    await prisma.cartEvent.create({
      data: {
        storeId: store.id,
        sessionId: "server",
        eventName: "newsletter_signup",
        payload: toJson({ source: parsed.data.source }),
      },
    });

    return { ok: true, message: "You're on the list. We email rarely and usefully." };
  } catch (error) {
    console.error("newsletter subscription failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
