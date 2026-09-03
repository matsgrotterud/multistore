import type { CatalogProjectionV2 } from "@/lib/catalog-v2";

export const MERCHANDISING_QUERY_V2 = "merchandising-query.v2" as const;
export const MERCHANDISING_RECOMMENDATIONS_V2 =
  "merchandising-recommendations.v2" as const;

export type MerchandisingAvailabilityV2 =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "UNKNOWN";

export interface MerchandisingAttributeDefinitionV2 {
  key: string;
  label: string;
  kind: "TEXT" | "INTEGER" | "DECIMAL" | "BOOLEAN" | "ENUM";
  facetable: boolean;
  comparable: boolean;
  unitCode: string | null;
  sortOrder: number;
}

export interface MerchandisingAttributeValueV2 {
  key: string;
  label: string;
  values: readonly string[];
  unitCode: string | null;
}

/** Public-only input. Provider IDs, costs and raw evidence are intentionally absent. */
export interface MerchandisingProductV2 {
  productId: string;
  title: string;
  description: string;
  taxonomyNodeIds: readonly string[];
  attributes: readonly MerchandisingAttributeValueV2[];
  priceMinor: number | null;
  currency: string | null;
  availability: MerchandisingAvailabilityV2;
  purchasable: boolean;
}

export interface MerchandisingSearchRequestV2 {
  query?: string;
  taxonomyNodeIds?: readonly string[];
  attributeFilters?: Readonly<Record<string, readonly string[]>>;
  availability?: readonly MerchandisingAvailabilityV2[];
  sort?: "RELEVANCE" | "PRICE_ASC" | "PRICE_DESC" | "TITLE_ASC";
  page?: number;
  pageSize?: number;
}

export interface MerchandisingFacetV2 {
  key: string;
  label: string;
  unitCode: string | null;
  values: Array<{ value: string; count: number }>;
}

export interface MerchandisingSearchResultV2 {
  version: typeof MERCHANDISING_QUERY_V2;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  products: MerchandisingProductV2[];
  facets: MerchandisingFacetV2[];
}

export interface MerchandisingComparisonRowV2 {
  key: string;
  label: string;
  unitCode: string | null;
  values: Array<{ productId: string; value: string | null }>;
}

export interface MerchandisingRecommendationV2 {
  product: MerchandisingProductV2;
  score: number;
  evidence: Array<
    | { code: "SHARED_TAXONOMY"; references: string[] }
    | { code: "SHARED_ATTRIBUTE"; references: string[] }
    | { code: "PRICE_PROXIMITY"; references: string[] }
    | { code: "AVAILABLE_FOR_PURCHASE"; references: [] }
  >;
}

export interface MerchandisingRecommendationSetV2 {
  version: typeof MERCHANDISING_RECOMMENDATIONS_V2;
  sourceProductId: string;
  method: "DETERMINISTIC_EVIDENCE_V1";
  experimentAssignment: null;
  attribution: null;
  items: MerchandisingRecommendationV2[];
}

/**
 * Explicit public adapter from the sanitized CatalogProjectionV2. Supplier
 * offers, cost, evidence, rights metadata and source payloads cannot enter the
 * merchandising runtime because those fields do not exist on this input.
 */
export function catalogProjectionToMerchandisingV2(
  projection: CatalogProjectionV2
): {
  products: MerchandisingProductV2[];
  attributeDefinitions: MerchandisingAttributeDefinitionV2[];
} {
  return {
    attributeDefinitions: projection.attributeDefinitions.map((definition) => ({
      key: definition.key,
      label: definition.label,
      kind: definition.dataType,
      facetable: definition.facetable,
      comparable: definition.comparable,
      unitCode: definition.unitCode,
      sortOrder: definition.position,
    })),
    products: projection.products.map((product) => ({
      productId: product.productId,
      title: product.title,
      description: product.description,
      taxonomyNodeIds: expandedTaxonomyReferencesV2(projection, product),
      attributes: merchandisingAttributesV2(product),
      priceMinor:
        product.price.state === "KNOWN"
          ? product.price.money.amountMinor
          : null,
      currency:
        product.price.state === "KNOWN"
          ? product.price.money.currency
          : null,
      availability: product.availability,
      purchasable: product.purchasable,
    })),
  };
}

function expandedTaxonomyReferencesV2(
  projection: CatalogProjectionV2,
  product: CatalogProjectionV2["products"][number]
): string[] {
  const categories = new Map(
    projection.taxonomy.nodes.map((node) => [node.taxonomyNodeId, node])
  );
  const references = new Set<string>();
  for (const taxonomyNodeId of product.taxonomyNodeIds) {
    let cursor = categories.get(taxonomyNodeId);
    while (cursor && !references.has(cursor.taxonomyNodeId)) {
      references.add(cursor.taxonomyNodeId);
      cursor = cursor.parentId ? categories.get(cursor.parentId) : undefined;
    }
  }
  return [...references].sort((left, right) => left.localeCompare(right));
}

function merchandisingAttributesV2(
  product: CatalogProjectionV2["products"][number]
): MerchandisingAttributeValueV2[] {
  const valuesByKey = new Map<
    string,
    { label: string; unitCode: string | null; values: Set<string> }
  >();
  const collect = (
    attribute: CatalogProjectionV2["products"][number]["attributes"][number]
  ) => {
    const current = valuesByKey.get(attribute.key) ?? {
      label: attribute.label,
      unitCode: attribute.unitCode,
      values: new Set<string>(),
    };
    for (const value of normalizeAttributeValues(attribute.value)) {
      current.values.add(value);
    }
    valuesByKey.set(attribute.key, current);
  };

  product.attributes.forEach(collect);
  for (const variant of product.variants) {
    variant.attributes.forEach(collect);
  }

  return [...valuesByKey.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, attribute]) => ({
      key,
      label: attribute.label,
      values: [...attribute.values].sort((left, right) =>
        left.localeCompare(right)
      ),
      unitCode: attribute.unitCode,
    }));
}

export function searchMerchandisingCatalogV2(input: {
  products: readonly MerchandisingProductV2[];
  attributeDefinitions: readonly MerchandisingAttributeDefinitionV2[];
  request?: MerchandisingSearchRequestV2;
}): MerchandisingSearchResultV2 {
  const request = normalizeRequest(input.request);
  const definitions = definitionMap(input.attributeDefinitions);
  const terms = tokenize(request.query);
  const taxonomy = new Set(request.taxonomyNodeIds);
  const availability = new Set(request.availability);
  const filters = normalizedFilters(request.attributeFilters, definitions);

  const matches = input.products
    .map((product) => ({ product: publicSnapshot(product), relevance: relevance(product, terms) }))
    .filter(({ product, relevance: score }) => {
      if (terms.length > 0 && score === 0) return false;
      if (
        taxonomy.size > 0 &&
        !product.taxonomyNodeIds.some((nodeId) => taxonomy.has(nodeId))
      ) {
        return false;
      }
      if (availability.size > 0 && !availability.has(product.availability)) return false;
      return [...filters.entries()].every(([key, selected]) => {
        const attribute = product.attributes.find((entry) => entry.key === key);
        return Boolean(
          attribute &&
            attribute.values.some((value) =>
              selected.has(normalizeFacetValue(value))
            )
        );
      });
    });

  matches.sort((left, right) => compareSearchRows(left, right, request.sort));
  const pageCount = matches.length === 0 ? 0 : Math.ceil(matches.length / request.pageSize);
  const start = (request.page - 1) * request.pageSize;
  const products = matches
    .slice(start, start + request.pageSize)
    .map(({ product }) => product);

  return {
    version: MERCHANDISING_QUERY_V2,
    total: matches.length,
    page: request.page,
    pageSize: request.pageSize,
    pageCount,
    products,
    facets: deriveMerchandisingFacetsV2(
      matches.map(({ product }) => product),
      input.attributeDefinitions
    ),
  };
}

export function deriveMerchandisingFacetsV2(
  products: readonly MerchandisingProductV2[],
  definitions: readonly MerchandisingAttributeDefinitionV2[]
): MerchandisingFacetV2[] {
  return [...definitions]
    .filter((definition) => definition.facetable)
    .sort(compareDefinitions)
    .flatMap((definition) => {
      const counts = new Map<string, number>();
      for (const product of products) {
        const values = product.attributes.find(
          (attribute) => attribute.key === definition.key
        )?.values;
        if (!values) continue;
        for (const normalized of new Set(values.map(normalizeFacetValue))) {
          if (!normalized) continue;
          counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        }
      }
      if (counts.size === 0) return [];
      return [
        {
          key: definition.key,
          label: definition.label,
          unitCode: definition.unitCode,
          values: [...counts.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([value, count]) => ({ value, count })),
        },
      ];
    });
}

export function compareMerchandisingProductsV2(input: {
  products: readonly MerchandisingProductV2[];
  attributeDefinitions: readonly MerchandisingAttributeDefinitionV2[];
  maxProducts?: number;
}): MerchandisingComparisonRowV2[] {
  const maxProducts = Math.max(2, Math.min(input.maxProducts ?? 4, 6));
  const products = deduplicateProducts(input.products).slice(0, maxProducts);
  return [...input.attributeDefinitions]
    .filter((definition) => definition.comparable)
    .sort(compareDefinitions)
    .map((definition) => ({
      key: definition.key,
      label: definition.label,
      unitCode: definition.unitCode,
      values: products.map((product) => ({
        productId: product.productId,
        value: displayAttributeValues(
          product.attributes.find((attribute) => attribute.key === definition.key)
            ?.values
        ),
      })),
    }));
}

export function recommendMerchandisingProductsV2(input: {
  sourceProductId: string;
  products: readonly MerchandisingProductV2[];
  attributeDefinitions: readonly MerchandisingAttributeDefinitionV2[];
  limit?: number;
}): MerchandisingRecommendationSetV2 {
  const source = input.products.find(
    (product) => product.productId === input.sourceProductId
  );
  if (!source) throw new Error("Recommendation source product was not found.");
  const comparableKeys = new Set(
    input.attributeDefinitions
      .filter((definition) => definition.comparable)
      .map((definition) => definition.key)
  );
  const limit = Math.max(1, Math.min(input.limit ?? 4, 12));

  const items = input.products
    .filter(
      (candidate) =>
        candidate.productId !== source.productId &&
        candidate.purchasable &&
        (candidate.availability === "IN_STOCK" ||
          candidate.availability === "LOW_STOCK")
    )
    .map((candidate) => scoreRecommendation(source, candidate, comparableKeys))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.product.productId.localeCompare(right.product.productId)
    )
    .slice(0, limit);

  return {
    version: MERCHANDISING_RECOMMENDATIONS_V2,
    sourceProductId: source.productId,
    method: "DETERMINISTIC_EVIDENCE_V1",
    experimentAssignment: null,
    attribution: null,
    items,
  };
}

function scoreRecommendation(
  source: MerchandisingProductV2,
  candidate: MerchandisingProductV2,
  comparableKeys: ReadonlySet<string>
): MerchandisingRecommendationV2 {
  const evidence: MerchandisingRecommendationV2["evidence"] = [];
  const sharedTaxonomy = source.taxonomyNodeIds
    .filter((nodeId) => candidate.taxonomyNodeIds.includes(nodeId))
    .sort();
  if (sharedTaxonomy.length > 0) {
    evidence.push({ code: "SHARED_TAXONOMY", references: sharedTaxonomy });
  }

  const candidateAttributes = new Map(
    candidate.attributes.map((attribute) => [
      attribute.key,
      new Set(attribute.values.map(normalizeFacetValue)),
    ])
  );
  const sharedAttributes = source.attributes
    .filter(
      (attribute) =>
        comparableKeys.has(attribute.key) &&
        attribute.values.some((value) =>
          candidateAttributes
            .get(attribute.key)
            ?.has(normalizeFacetValue(value))
        )
    )
    .map((attribute) => attribute.key)
    .sort();
  if (sharedAttributes.length > 0) {
    evidence.push({ code: "SHARED_ATTRIBUTE", references: sharedAttributes });
  }

  let pricePoints = 0;
  if (
    source.priceMinor !== null &&
    source.priceMinor > 0 &&
    candidate.priceMinor !== null &&
    candidate.currency === source.currency
  ) {
    const difference = Math.abs(candidate.priceMinor - source.priceMinor);
    const ratio = difference / source.priceMinor;
    if (ratio <= 0.35) {
      pricePoints = Math.round((1 - ratio / 0.35) * 20);
      evidence.push({ code: "PRICE_PROXIMITY", references: [source.currency ?? ""] });
    }
  }
  evidence.push({ code: "AVAILABLE_FOR_PURCHASE", references: [] });

  return {
    product: publicSnapshot(candidate),
    score:
      sharedTaxonomy.length * 30 +
      sharedAttributes.length * 15 +
      pricePoints +
      5,
    evidence,
  };
}

function normalizeRequest(request: MerchandisingSearchRequestV2 | undefined) {
  const page = finiteInteger(request?.page, 1, 10_000, 1);
  const pageSize = finiteInteger(request?.pageSize, 1, 100, 24);
  return {
    query: request?.query?.trim().slice(0, 200) ?? "",
    taxonomyNodeIds: uniqueBounded(request?.taxonomyNodeIds ?? [], 100),
    attributeFilters: request?.attributeFilters ?? {},
    availability: uniqueAvailability(request?.availability ?? []),
    sort: request?.sort ?? "RELEVANCE",
    page,
    pageSize,
  } as const;
}

function normalizedFilters(
  raw: Readonly<Record<string, readonly string[]>>,
  definitions: ReadonlyMap<string, MerchandisingAttributeDefinitionV2>
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const [key, values] of Object.entries(raw).slice(0, 50)) {
    if (!definitions.get(key)?.facetable) continue;
    const normalized = uniqueBounded(values, 100)
      .map(normalizeFacetValue)
      .filter(Boolean);
    if (normalized.length > 0) result.set(key, new Set(normalized));
  }
  return result;
}

function relevance(product: MerchandisingProductV2, terms: readonly string[]): number {
  if (terms.length === 0) return 0;
  const title = normalizeSearchText(product.title);
  const description = normalizeSearchText(product.description);
  const attributes = normalizeSearchText(
    product.attributes
      .map((attribute) => `${attribute.label} ${attribute.values.join(" ")}`)
      .join(" ")
  );
  return terms.reduce(
    (score, term) =>
      score +
      (title.includes(term) ? 8 : 0) +
      (description.includes(term) ? 3 : 0) +
      (attributes.includes(term) ? 2 : 0),
    0
  );
}

function compareSearchRows(
  left: { product: MerchandisingProductV2; relevance: number },
  right: { product: MerchandisingProductV2; relevance: number },
  sort: NonNullable<MerchandisingSearchRequestV2["sort"]>
): number {
  if (sort === "PRICE_ASC" || sort === "PRICE_DESC") {
    const direction = sort === "PRICE_ASC" ? 1 : -1;
    const leftPrice = left.product.priceMinor;
    const rightPrice = right.product.priceMinor;
    if (leftPrice === null && rightPrice !== null) return 1;
    if (leftPrice !== null && rightPrice === null) return -1;
    if (leftPrice !== rightPrice) return ((leftPrice ?? 0) - (rightPrice ?? 0)) * direction;
  } else if (sort === "TITLE_ASC") {
    const title = left.product.title.localeCompare(right.product.title);
    if (title !== 0) return title;
  } else if (left.relevance !== right.relevance) {
    return right.relevance - left.relevance;
  }
  return left.product.productId.localeCompare(right.product.productId);
}

function publicSnapshot(product: MerchandisingProductV2): MerchandisingProductV2 {
  return {
    productId: product.productId,
    title: product.title,
    description: product.description,
    taxonomyNodeIds: [...product.taxonomyNodeIds],
    attributes: product.attributes.map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      values: [...attribute.values],
      unitCode: attribute.unitCode,
    })),
    priceMinor:
      product.priceMinor !== null &&
      Number.isSafeInteger(product.priceMinor) &&
      product.priceMinor >= 0
        ? product.priceMinor
        : null,
    currency: product.currency,
    availability: product.availability,
    purchasable: product.purchasable,
  };
}

function definitionMap(
  definitions: readonly MerchandisingAttributeDefinitionV2[]
): Map<string, MerchandisingAttributeDefinitionV2> {
  return new Map(definitions.map((definition) => [definition.key, definition]));
}

function compareDefinitions(
  left: MerchandisingAttributeDefinitionV2,
  right: MerchandisingAttributeDefinitionV2
): number {
  return left.sortOrder - right.sortOrder || left.key.localeCompare(right.key);
}

function deduplicateProducts(
  products: readonly MerchandisingProductV2[]
): MerchandisingProductV2[] {
  const byId = new Map<string, MerchandisingProductV2>();
  for (const product of products) {
    if (!byId.has(product.productId)) byId.set(product.productId, publicSnapshot(product));
  }
  return [...byId.values()];
}

function normalizeFacetValue(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 160);
}

function normalizeAttributeValues(
  value: string | number | boolean | Array<string | number | boolean>
): string[] {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((entry) => normalizeFacetValue(String(entry))))]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

function displayAttributeValues(values: readonly string[] | undefined): string | null {
  return values && values.length > 0 ? values.join(", ") : null;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US");
}

function tokenize(value: string): string[] {
  return [...new Set(normalizeSearchText(value).match(/[\p{L}\p{N}]+/gu) ?? [])].slice(
    0,
    12
  );
}

function uniqueBounded(values: readonly string[], limit: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

function uniqueAvailability(
  values: readonly MerchandisingAvailabilityV2[]
): MerchandisingAvailabilityV2[] {
  const allowed = new Set<MerchandisingAvailabilityV2>([
    "IN_STOCK",
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "UNKNOWN",
  ]);
  return [...new Set(values.filter((value) => allowed.has(value)))];
}

function finiteInteger(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  return typeof value === "number" && Number.isInteger(value)
    ? Math.max(min, Math.min(value, max))
    : fallback;
}
