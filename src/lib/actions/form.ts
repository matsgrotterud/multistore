import type { FaqItem, SpecItem } from "@/lib/types";

/**
 * Small helpers for reading admin FormData in server actions. They normalise
 * the loosely-typed FormData values into the shapes our Zod schemas expect.
 */

export function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

export function getNumber(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

/** Unchecked checkboxes are absent from FormData entirely. */
export function getBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

/** Split a textarea into trimmed, non-empty lines. */
export function getLines(formData: FormData, key: string): string[] {
  return getString(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Split a comma-separated input into trimmed, non-empty values. */
export function getCsv(formData: FormData, key: string): string[] {
  return getString(formData, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Parse "label | value" lines into SpecItem[]. */
export function getPipePairs(formData: FormData, key: string): SpecItem[] {
  return getLines(formData, key)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), value: rest.join("|").trim() };
    })
    .filter((item) => item.label && item.value);
}

/** Parse "question | answer" lines into FaqItem[]. */
export function getFaqPairs(formData: FormData, key: string): FaqItem[] {
  return getLines(formData, key)
    .map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: question.trim(), answer: rest.join("|").trim() };
    })
    .filter((item) => item.question && item.answer);
}
