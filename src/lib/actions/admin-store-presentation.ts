"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { getBoolean, getLines, getString } from "@/lib/actions/form";
import {
  normalizeStorefrontPresentation,
  OPTIONAL_STOREFRONT_SECTION_IDS,
  storefrontPresentationV1Schema,
  type OptionalStorefrontSectionId,
} from "@/lib/storefront/presentation";
import {
  parseStoreSettings,
  serializeStoreSettings,
} from "@/lib/settings/store-settings";

export interface PresentationActionState {
  ok: boolean;
  error: string | null;
  message?: string;
}

export async function updateStorePresentationAction(
  _previous: PresentationActionState,
  formData: FormData
): Promise<PresentationActionState> {
  await requireAdmin();

  const slug = getString(formData, "slug");
  if (!slug) return { ok: false, error: "Missing store identifier." };

  const hiddenSections = OPTIONAL_STOREFRONT_SECTION_IDS.filter(
    (section): section is OptionalStorefrontSectionId =>
      !getBoolean(formData, `show_${section}`)
  );
  const parsed = storefrontPresentationV1Schema.safeParse({
    version: "storefront-presentation.v1",
    archetype: getString(formData, "archetype"),
    density: getString(formData, "density"),
    hero: getString(formData, "hero"),
    sectionOrder: getLines(formData, "sectionOrder"),
    hiddenSections,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid presentation settings.",
    };
  }

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { settings: true },
  });
  if (!store) return { ok: false, error: "Store not found." };

  const current = parseStoreSettings(store.settings?.settings);
  const next = {
    ...current,
    presentation: normalizeStorefrontPresentation(parsed.data),
  };

  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    create: { storeId: store.id, settings: serializeStoreSettings(next) },
    update: { settings: serializeStoreSettings(next) },
  });

  revalidatePath(`/s/${slug}`, "layout");
  revalidatePath(`/admin/stores/${slug}/design`);
  revalidatePath(`/admin/stores/${slug}/edit`);

  return { ok: true, error: null, message: "Storefront design saved." };
}

