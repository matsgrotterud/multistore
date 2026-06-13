import { z } from "zod";
import type { FaqItem, SpecItem } from "@/lib/types";

/**
 * SQLite stores our JSON columns as strings. These helpers parse them safely
 * with Zod so malformed data degrades to an empty value instead of crashing
 * a page render.
 */

const stringArraySchema = z.array(z.string());

const specArraySchema = z.array(
  z.object({ label: z.string(), value: z.string() })
);

const faqArraySchema = z.array(
  z.object({ question: z.string(), answer: z.string() })
);

function safeParse<T>(raw: string | null | undefined, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function parseStringArray(raw: string | null | undefined): string[] {
  return safeParse(raw, stringArraySchema, []);
}

export function parseSpecs(raw: string | null | undefined): SpecItem[] {
  return safeParse(raw, specArraySchema, []);
}

export function parseFaq(raw: string | null | undefined): FaqItem[] {
  return safeParse(raw, faqArraySchema, []);
}

export function parseJsonObject(
  raw: string | null | undefined
): Record<string, unknown> {
  return safeParse(raw, z.record(z.unknown()), {});
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
