"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  generateProductCopy,
  generateStoreBlueprint,
  storeBlueprintInputSchema,
  type BlueprintResult,
  type ProductCopyResult,
} from "@/lib/ai/store-blueprint";
import { prisma } from "@/lib/db";
import {
  createStoreFromBlueprint,
  type CreateStoreFromBlueprintResult,
} from "@/lib/stores/create-from-blueprint";
import { getMediaStorageSafetyReport } from "@/lib/storage/media-storage-safety";

export interface GeneratorActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function generateBlueprintAction(
  input: unknown
): Promise<GeneratorActionResult<BlueprintResult>> {
  try {
    await requireAdmin();
    const data = await generateStoreBlueprint(input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("blueprint generation failed", error);
    return { ok: false, error: "Generation failed. Check the server logs." };
  }
}

export async function generateProductCopyAction(
  input: unknown
): Promise<GeneratorActionResult<ProductCopyResult>> {
  try {
    await requireAdmin();
    const data = await generateProductCopy(input);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("product copy generation failed", error);
    return { ok: false, error: "Generation failed. Check the server logs." };
  }
}

export async function createStoreFromBlueprintAction(options: {
  blueprintInput: unknown;
  importProducts?: boolean;
  autoPublishScored?: boolean;
}): Promise<GeneratorActionResult<CreateStoreFromBlueprintResult>> {
  try {
    await requireAdmin();

    // Preflight: block before creating ANY rows if media would be written
    // locally into a remote DB (prevents orphaned stores + broken live images).
    if ((options.importProducts ?? true) !== false) {
      const safety = getMediaStorageSafetyReport();
      if (safety.unsafe) {
        return { ok: false, error: safety.message };
      }
    }

    const input = storeBlueprintInputSchema.parse(options.blueprintInput);
    const { blueprint, guardrails } = await generateStoreBlueprint(input);

    if (!guardrails.passed) {
      return {
        ok: false,
        error:
          "Blueprint blocked by content guardrails. Fix the flagged issues or adjust your niche copy, then try again.",
      };
    }

    const result = await createStoreFromBlueprint({
      blueprint,
      input,
      importProducts: options.importProducts ?? true,
      autoPublishScored: options.autoPublishScored ?? true,
    });

    revalidatePath("/admin/stores");
    revalidatePath("/admin/products");
    revalidatePath("/admin/generator");
    revalidatePath(`/s/${result.storeSlug}`, "layout");

    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
    }
    console.error("create store from blueprint failed", error);
    const message = error instanceof Error ? error.message : "Create failed.";
    return { ok: false, error: message };
  }
}

export async function markStoreLiveAction(
  slug: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return { ok: false, error: "Store not found." };
    if (!store.plannedDomain && !store.primaryDomain.includes(".")) {
      return { ok: false, error: "Set a planned domain before going live." };
    }

    await prisma.store.update({
      where: { id: store.id },
      data: {
        launchStatus: "LIVE",
        primaryDomain: store.plannedDomain ?? store.primaryDomain,
      },
    });

    revalidatePath("/admin/stores");
    revalidatePath(`/admin/stores/${slug}/edit`);
    revalidatePath(`/s/${slug}`, "layout");
    return { ok: true };
  } catch (error) {
    console.error("mark store live failed", error);
    return { ok: false, error: "Could not update launch status." };
  }
}
