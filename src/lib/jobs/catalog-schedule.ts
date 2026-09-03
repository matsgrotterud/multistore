export const DEFAULT_CATALOG_REFRESH_CADENCE_HOURS = 24;
export const DEFAULT_CATALOG_DISCOVERY_CADENCE_HOURS = 7 * 24;

export interface CatalogScheduleStore {
  id: string;
  niche: string;
  supplierSettings: Array<{
    providerKey: string;
    importQueries: string;
  }>;
  categories: Array<{ id: string }>;
}

export interface CatalogScheduledJob {
  storeId: string;
  providerKey: string;
  jobType: "REFRESH_EXISTING" | "DISCOVER";
  dedupeKey: string;
  payload: Record<string, unknown>;
  runAfter: Date;
}

export interface CatalogSchedulePlan {
  refreshJobs: CatalogScheduledJob[];
  discoveryJobs: CatalogScheduledJob[];
  storesWithoutProvider: number;
  providersSkipped: number;
}

export function catalogCadenceBucket(now: Date, cadenceHours: number): string {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error("Invalid catalog schedule clock.");
  if (!Number.isInteger(cadenceHours) || cadenceHours < 1 || cadenceHours > 31 * 24) {
    throw new Error("Catalog cadence must be between 1 and 744 whole hours.");
  }
  return String(Math.floor(timestamp / (cadenceHours * 60 * 60 * 1000)));
}

export function normalizeCatalogQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export function catalogAutomationAllowsProvider(input: {
  providerKey: string;
  allowMockAutomation: boolean;
}): boolean {
  const providerKey = normalizeProviderKey(input.providerKey);
  return providerKey.length > 0 && (providerKey !== "mock" || input.allowMockAutomation);
}

export function catalogStoreProviderKey(storeId: string, providerKey: string): string {
  return `${storeId.trim()}\u001f${normalizeProviderKey(providerKey)}`;
}

/**
 * Pure scheduling plan. Keeping planning separate from persistence lets us
 * prove portfolio-wide coverage and then write all cadence jobs in two bulk
 * operations, regardless of whether there are 1 or 100 stores.
 */
export function buildCatalogSchedulePlan(input: {
  stores: readonly CatalogScheduleStore[];
  boundStoreProviders: ReadonlySet<string>;
  allowMockAutomation: boolean;
  refreshBucket: string;
  discoveryBucket: string;
  refreshLimit: number;
  refreshCadenceHours: number;
  now: Date;
}): CatalogSchedulePlan {
  const plan: CatalogSchedulePlan = {
    refreshJobs: [],
    discoveryJobs: [],
    storesWithoutProvider: 0,
    providersSkipped: 0,
  };

  for (const store of input.stores) {
    const settings =
      store.supplierSettings.length > 0
        ? store.supplierSettings
        : input.allowMockAutomation
          ? [{ providerKey: "mock", importQueries: JSON.stringify([store.niche]) }]
          : [];
    let eligibleProviders = 0;

    for (const setting of settings) {
      const providerKey = normalizeProviderKey(setting.providerKey);
      if (
        !catalogAutomationAllowsProvider({
          providerKey,
          allowMockAutomation: input.allowMockAutomation,
        })
      ) {
        plan.providersSkipped += 1;
        continue;
      }
      eligibleProviders += 1;

      if (
        input.boundStoreProviders.has(
          catalogStoreProviderKey(store.id, providerKey)
        )
      ) {
        plan.refreshJobs.push({
          storeId: store.id,
          providerKey,
          jobType: "REFRESH_EXISTING",
          dedupeKey: `refresh:${input.refreshBucket}`,
          payload: {
            limit: input.refreshLimit,
            maxAgeHours: input.refreshCadenceHours,
            allowFixtureMode:
              providerKey === "mock" && input.allowMockAutomation,
          },
          runAfter: input.now,
        });
      }

      const categoryId = store.categories[0]?.id;
      for (const query of selectCatalogQueries(setting.importQueries, 2)) {
        const normalizedQuery = normalizeCatalogQuery(query);
        plan.discoveryJobs.push({
          storeId: store.id,
          providerKey,
          jobType: "DISCOVER",
          dedupeKey: `discover:${input.discoveryBucket}:${normalizedQuery}:${categoryId ?? "auto"}`,
          payload: { query: query.trim(), categoryId },
          runAfter: input.now,
        });
      }
    }

    if (eligibleProviders === 0) plan.storesWithoutProvider += 1;
  }

  return plan;
}

export function parseCatalogQueries(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
      : [];
  } catch {
    return [];
  }
}

export function selectCatalogQueries(raw: string, limit: number): string[] {
  const boundedLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 0), 20) : 0;
  if (boundedLimit === 0) return [];
  const selected: string[] = [];
  const seen = new Set<string>();
  for (const query of parseCatalogQueries(raw)) {
    const normalized = normalizeCatalogQuery(query);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    selected.push(query.trim());
    if (selected.length >= boundedLimit) break;
  }
  return selected;
}

function normalizeProviderKey(value: string): string {
  return value.trim().toLowerCase();
}
