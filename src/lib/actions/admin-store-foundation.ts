"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getString } from "@/lib/actions/form";
import { prisma } from "@/lib/db";
import { proposeStoreFoundation } from "@/lib/admin/store-foundation";
import {
  parseStoreSettings,
  serializeStoreSettings,
} from "@/lib/settings/store-settings";

export interface StoreFoundationActionState {
  ok: boolean;
  error: string | null;
  message?: string;
}

const foundationEditSchema = z.object({
  heroTitle: z.string().trim().min(3).max(90),
  heroBody: z.string().trim().min(20).max(420),
  seoTitle: z.string().trim().min(10).max(70),
  seoDescription: z.string().trim().min(40).max(170),
});

export async function updateStoreFoundationAction(
  _previous: StoreFoundationActionState,
  formData: FormData
): Promise<StoreFoundationActionState> {
  await requireAdmin();
  const slug = getString(formData, "slug");
  if (!slug) return { ok: false, error: "Missing store identifier." };

  const parsed = foundationEditSchema.safeParse({
    heroTitle: getString(formData, "heroTitle"),
    heroBody: getString(formData, "heroBody"),
    seoTitle: getString(formData, "seoTitle"),
    seoDescription: getString(formData, "seoDescription"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid foundation copy.",
    };
  }

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logoText: true,
      niche: true,
      audience: true,
      brandVoice: true,
      positioning: true,
      locale: true,
      theme: {
        select: {
          primaryColor: true,
          backgroundColor: true,
          textColor: true,
        },
      },
      settings: { select: { settings: true } },
    },
  });
  if (!store) return { ok: false, error: "Store not found." };

  const foundation = proposeStoreFoundation(store, parsed.data);
  if (foundation.audit.status !== "PASS") {
    const failed = foundation.audit.checks
      .filter((check) => check.status !== "PASS")
      .map((check) => check.id)
      .join(", ");
    return {
      ok: false,
      error: `Foundation remains in review: ${failed}. No draft was saved.`,
    };
  }

  const current = parseStoreSettings(store.settings?.settings);
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    create: {
      storeId: store.id,
      settings: serializeStoreSettings({ ...current, foundation }),
    },
    update: {
      settings: serializeStoreSettings({ ...current, foundation }),
    },
  });

  revalidatePath(`/admin/stores/${slug}/foundation`);
  revalidatePath(`/admin/stores/${slug}/edit`);
  revalidatePath("/admin/stores");
  return {
    ok: true,
    error: null,
    message: "Foundation draft saved without changing catalog or launch state.",
  };
}
