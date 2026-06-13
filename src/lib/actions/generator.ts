"use server";

import { ZodError } from "zod";
import {
  generateProductCopy,
  generateStoreBlueprint,
  type BlueprintResult,
  type ProductCopyResult,
} from "@/lib/ai/store-blueprint";

export interface GeneratorActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function generateBlueprintAction(
  input: unknown
): Promise<GeneratorActionResult<BlueprintResult>> {
  try {
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
