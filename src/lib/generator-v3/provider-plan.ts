export const CATALOG_PROVIDER_PLAN_VERSION = "catalog-provider-plan.v1" as const;

export type GenerationProviderMode =
  | "CONFIGURED"
  | "SYNTHETIC_DEMO"
  | "FOUNDATION_ONLY";

export interface GenerationProviderPlanV1 {
  mode: GenerationProviderMode;
  providerKeys: string[];
}

/**
 * Foundation-only generation is an explicit no-provider mode. It never reads
 * configured defaults and therefore cannot accidentally create supplier
 * settings or call a provider while product import is disabled.
 */
export function resolveGenerationProviderPlanV1(input: {
  importProducts: boolean;
  useDemoCatalog?: boolean;
  configuredCsv?: string | null;
}): GenerationProviderPlanV1 {
  if (!input.importProducts) {
    return { mode: "FOUNDATION_ONLY", providerKeys: [] };
  }
  if (input.useDemoCatalog) {
    return { mode: "SYNTHETIC_DEMO", providerKeys: ["mock"] };
  }
  return {
    mode: "CONFIGURED",
    providerKeys: resolveCatalogProviderKeysV1({
      configuredCsv: input.configuredCsv,
    }),
  };
}

/**
 * Resolve the exact provider list for one generation/import execution.
 *
 * Synthetic fixtures are authority-bearing test data, so they may only enter
 * through an explicit caller choice. A configured/default execution never
 * silently degrades to mock data when CJ is disabled or missing credentials.
 */
export function resolveCatalogProviderKeysV1(input: {
  explicit?: string[];
  configuredCsv?: string | null;
}): string[] {
  const explicit = normalizeKeys(input.explicit ?? []);
  if (explicit.includes("mock") && explicit.length !== 1) {
    throw new Error(
      "Synthetic mock catalog must run alone and cannot be mixed with live providers."
    );
  }
  if (explicit.length > 0) return explicit;

  const configured = normalizeKeys((input.configuredCsv ?? "").split(","));
  if (configured.includes("mock")) {
    throw new Error(
      "Synthetic mock catalog must be selected explicitly; remove mock from CATALOG_IMPORT_PROVIDER_KEYS."
    );
  }
  return configured.length > 0 ? configured : ["cj"];
}

function normalizeKeys(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}
