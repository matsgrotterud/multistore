function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, child]) => [key, sortJson(child)])
  );
}

/** Stable JSON makes reports diffable and byte-identical for the same snapshot. */
export function stableJson(value: unknown): string {
  return `${JSON.stringify(sortJson(value), null, 2)}\n`;
}
