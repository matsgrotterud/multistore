"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getOptionalString, getString } from "@/lib/actions/form";
import {
  createFoundationStore,
  type CreateFoundationStoreResult,
} from "@/lib/stores/create-foundation-store";

export interface FoundationStoreActionState {
  ok: boolean;
  error: string | null;
  result?: CreateFoundationStoreResult;
}

export async function createFoundationStoreAction(
  _previous: FoundationStoreActionState,
  formData: FormData
): Promise<FoundationStoreActionState> {
  await requireAdmin();
  try {
    const result = await createFoundationStore({
      brandName: getOptionalString(formData, "brandName") ?? undefined,
      niche: getString(formData, "niche"),
      audience: getString(formData, "audience"),
      brandVoice: getString(formData, "brandVoice"),
      locale: getString(formData, "locale"),
      country: getString(formData, "country"),
      plannedDomain: getOptionalString(formData, "plannedDomain") ?? undefined,
      idempotencyKey: getString(formData, "idempotencyKey"),
    });
    revalidatePath("/admin/stores");
    revalidatePath("/admin/seo-audit");
    return { ok: true, error: null, result };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: error.issues[0]?.message ?? "Invalid foundation input.",
      };
    }
    console.error("foundation-only store creation failed", error);
    return { ok: false, error: "Could not create the foundation draft." };
  }
}
