export const STORE_FACTORY_V2_INTERNAL_PREVIEW_PATH =
  "/admin-preview/store-factory-v2" as const;

const REFERENCE_FIXTURES_V2 = [
  "drones",
  "apparel",
  "consumables",
] as const;

type ReferenceFixtureV2 = (typeof REFERENCE_FIXTURES_V2)[number];

export type StoreFactoryV2PreviewQuery =
  | {
      mode: "reference";
      fixture: ReferenceFixtureV2;
      revisionId?: string;
    }
  | {
      mode: "persisted";
      storeSlug: string;
      revisionId: string;
    };

type PreviewSearchParamsRecord = Readonly<
  Record<string, string | string[] | undefined>
>;

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const storeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const knownKeys = new Set(["mode", "fixture", "revision", "store"]);

function isReferenceFixture(value: string | undefined): value is ReferenceFixtureV2 {
  return REFERENCE_FIXTURES_V2.some((fixture) => fixture === value);
}

function parseEntries(
  entries: Iterable<readonly [string, string]>
): StoreFactoryV2PreviewQuery | null {
  const values = new Map<string, string>();
  for (const [key, value] of entries) {
    if (!knownKeys.has(key) || values.has(key)) return null;
    values.set(key, value);
  }

  const mode = values.get("mode");
  if (mode === "persisted") {
    if (
      values.size !== 3 ||
      !values.has("store") ||
      !values.has("revision")
    ) {
      return null;
    }
    const storeSlug = values.get("store");
    const revisionId = values.get("revision");
    if (
      !storeSlug ||
      !storeSlugPattern.test(storeSlug) ||
      storeSlug.length > 120 ||
      !revisionId ||
      !identifierPattern.test(revisionId)
    ) {
      return null;
    }
    return { mode: "persisted", storeSlug, revisionId };
  }

  if (mode !== undefined && mode !== "reference") return null;
  const expectedSize = mode === "reference" ? 2 : 1;
  const revisionId = values.get("revision");
  if (
    values.size !== expectedSize + (revisionId === undefined ? 0 : 1) ||
    !values.has("fixture") ||
    values.has("store")
  ) {
    return null;
  }
  const fixture = values.get("fixture");
  if (
    !isReferenceFixture(fixture) ||
    (revisionId !== undefined && !identifierPattern.test(revisionId))
  ) {
    return null;
  }
  return {
    mode: "reference",
    fixture,
    ...(revisionId === undefined ? {} : { revisionId }),
  };
}

/** Parse the exact query shape supplied by a Next page. Arrays mean duplicates. */
export function parseStoreFactoryV2PreviewSearchParams(
  input: PreviewSearchParamsRecord
): StoreFactoryV2PreviewQuery | null {
  const entries: Array<readonly [string, string]> = [];
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) return null;
    if (value !== undefined) entries.push([key, value]);
  }
  return parseEntries(entries);
}

/** Parse only the same-origin internal frame URL with an exact query shape. */
export function parseStoreFactoryV2PreviewUrl(
  value: string
): StoreFactoryV2PreviewQuery | null {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const parsed = new URL(value, "http://preview.invalid");
    if (
      parsed.origin !== "http://preview.invalid" ||
      parsed.pathname !== STORE_FACTORY_V2_INTERNAL_PREVIEW_PATH ||
      parsed.hash
    ) {
      return null;
    }
    return parseEntries(parsed.searchParams.entries());
  } catch {
    return null;
  }
}
