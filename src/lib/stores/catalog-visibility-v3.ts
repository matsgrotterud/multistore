import type { Category, Product, Store } from "@prisma/client";
import {
  evaluateCandidateV1,
  ontologyEntryForClass,
  resolveNicheIntentV1,
  type CandidateEvaluationV1,
  type EvaluationGateV1,
} from "@/lib/generator-v3";
import { parseJsonObject, parseSpecs } from "@/lib/utils/json";

export const CATALOG_VISIBILITY_POLICY_VERSION = "catalog-visibility.v3";

type CatalogVisibilityStore = Pick<Store, "niche" | "launchStatus">;
type CatalogCategoryProjectionStore = Pick<Store, "id" | "niche" | "launchStatus">;
type CatalogVisibilityProduct = Pick<
  Product,
  | "title"
  | "description"
  | "supplierDataJson"
  | "specs"
  | "providerKey"
  | "externalId"
  | "sourceUrl"
  | "mediaStatus"
  | "qualityStatus"
  | "price"
  | "marginPercent"
  | "shippingDaysMax"
>;

export interface CatalogVisibilityDecisionV3 {
  visible: boolean;
  reasonCodes: string[];
  evaluation: CandidateEvaluationV1 | null;
  mode: "LIVE_COMPATIBILITY" | "V3_PREVIEW" | "LEGACY_PREVIEW_QUARANTINE";
}

function rawSupplierEvidence(product: CatalogVisibilityProduct): {
  title: string;
  description: string;
  providerCategoryPath?: string;
} {
  const raw = parseJsonObject(product.supplierDataJson);
  const rawTitle = typeof raw.rawTitle === "string" ? raw.rawTitle : product.title;
  const rawDescription =
    typeof raw.rawDescription === "string" ? raw.rawDescription : product.description;
  const providerCategoryPath =
    typeof raw.providerCategoryPath === "string" ? raw.providerCategoryPath : undefined;
  return { title: rawTitle, description: rawDescription, providerCategoryPath };
}

type PersistedEvaluationResult =
  | { kind: "MISSING" }
  | { kind: "INVALID" }
  | { kind: "VALID"; evaluation: CandidateEvaluationV1 };

function persistedEvaluation(
  product: CatalogVisibilityProduct
): PersistedEvaluationResult {
  const raw = parseJsonObject(product.supplierDataJson);
  const value = raw.candidateEvaluationV1;
  if (value == null) return { kind: "MISSING" };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { kind: "INVALID" };
  }
  const evaluation = value as Partial<CandidateEvaluationV1>;
  const gates = [
    evaluation.relevance,
    evaluation.policy,
    evaluation.supplierEvidence,
    evaluation.mediaReadiness,
    evaluation.variantReadiness,
    evaluation.priceMargin,
    evaluation.shipping,
    evaluation.riskIp,
    evaluation.previewVisibility,
    evaluation.liveCommerceEligibility,
  ];
  if (
    evaluation.version !== "candidate-evaluator.v1" ||
    typeof evaluation.evaluatedAt !== "string" ||
    !Number.isFinite(Date.parse(evaluation.evaluatedAt)) ||
    typeof evaluation.intentVersion !== "string" ||
    !gates.every(isEvaluationGate)
  ) {
    return { kind: "INVALID" };
  }
  return { kind: "VALID", evaluation: evaluation as CandidateEvaluationV1 };
}

function isEvaluationGate(value: unknown): value is EvaluationGateV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const gate = value as Partial<EvaluationGateV1>;
  return (
    ["PASS", "FAIL", "UNKNOWN", "REVIEW"].includes(gate.state ?? "") &&
    Array.isArray(gate.reasonCodes) &&
    gate.reasonCodes.every((reason) => typeof reason === "string") &&
    typeof gate.explanation === "string" &&
    Array.isArray(gate.evidence)
  );
}

/**
 * One read-time decision for homepage, categories, search, quiz, collections
 * and direct product routes. Existing LIVE stores intentionally keep their
 * current catalog until a reviewed backfill exists. PREVIEW always fails
 * closed, including legacy rows without a persisted V3 evaluation.
 */
export function decideCatalogVisibilityV3(
  store: CatalogVisibilityStore,
  product: CatalogVisibilityProduct
): CatalogVisibilityDecisionV3 {
  if (store.launchStatus === "LIVE") {
    return { visible: true, reasonCodes: [], evaluation: null, mode: "LIVE_COMPATIBILITY" };
  }

  const persisted = persistedEvaluation(product);
  if (persisted.kind === "INVALID") {
    return {
      visible: false,
      reasonCodes: ["PERSISTED_EVALUATION_INVALID"],
      evaluation: null,
      mode: "V3_PREVIEW",
    };
  }
  if (persisted.kind === "VALID") {
    const evaluation = persisted.evaluation;
    const visible =
      evaluation.relevance.state === "PASS" &&
      evaluation.policy.state !== "FAIL" &&
      evaluation.previewVisibility.state === "PASS";
    return {
      visible,
      reasonCodes: visible
        ? []
        : [
            ...evaluation.relevance.reasonCodes,
            ...evaluation.policy.reasonCodes,
            ...evaluation.previewVisibility.reasonCodes,
          ],
      evaluation,
      mode: "V3_PREVIEW",
    };
  }

  const intent = resolveNicheIntentV1({ niche: store.niche });
  const supplier = rawSupplierEvidence(product);
  const evaluation = evaluateCandidateV1(intent, {
    ...supplier,
    specs: parseSpecs(product.specs),
    providerKey: product.providerKey,
    externalId: product.externalId,
    sourceUrl: product.sourceUrl,
    // Legacy safety-net knows only Product.mediaStatus. This is accepted for
    // quarantine visibility, never for V3 generation/publishing evidence.
    usableStoredMediaCount: product.mediaStatus === "OK" ? 1 : 0,
    variantIdentityReady: true,
    price: product.price,
    marginPercent: product.marginPercent,
    shippingDaysMax: product.shippingDaysMax,
    riskVeto: product.qualityStatus === "BLOCKED",
    groundedContentReady: true,
  });
  const visible =
    evaluation.relevance.state === "PASS" &&
    evaluation.policy.state !== "FAIL" &&
    evaluation.previewVisibility.state === "PASS";
  return {
    visible,
    reasonCodes: visible
      ? []
      : [
          ...evaluation.relevance.reasonCodes,
          ...evaluation.policy.reasonCodes,
          ...evaluation.previewVisibility.reasonCodes,
        ],
    evaluation,
    mode: "LEGACY_PREVIEW_QUARANTINE",
  };
}

export function filterCatalogProductsV3<T extends CatalogVisibilityProduct>(
  store: CatalogVisibilityStore,
  products: T[]
): T[] {
  return products.filter((product) => decideCatalogVisibilityV3(store, product).visible);
}

/**
 * Projects the single truthful ontology category for non-LIVE stores without
 * persisting anything. The tenant-scoped synthetic id is stable across reads,
 * so callers can use this as a Prisma Category-shaped fallback when a legacy
 * preview has no matching category row. LIVE stores remain database-authoritative.
 */
export function projectVirtualCatalogCategoryV3(
  store: CatalogCategoryProjectionStore
): Category | null {
  if (store.launchStatus === "LIVE") return null;

  const intent = resolveNicheIntentV1({ niche: store.niche });
  const ontology = ontologyEntryForClass(intent.productClass);
  if (!ontology) return null;

  const { slug, name, description } = ontology.category;
  return {
    id: `virtual-category-v3:${store.id}:${slug}`,
    storeId: store.id,
    slug,
    name,
    description,
    seoTitle: name,
    seoDescription: description.slice(0, 155),
    heroTitle: name,
    heroSubtitle: description.slice(0, 120),
    sortOrder: 0,
  };
}

/**
 * Resolve the category used by a non-LIVE storefront read.
 *
 * Static ontology remains authoritative for built-in classes. A dynamic class
 * has no virtual category, so it may use its actual tenant-scoped category only
 * after the caller has proved that at least one product in that category passed
 * the complete persisted V3 preview evaluation. This explicit boolean keeps an
 * arbitrary legacy category from becoming visible merely because it exists.
 */
export function selectPreviewCatalogCategoryV3(
  store: CatalogCategoryProjectionStore,
  persistedCategory: Category | null,
  hasVisibleV3Product: boolean
): Category | null {
  if (store.launchStatus === "LIVE") return null;
  const virtualCategory = projectVirtualCatalogCategoryV3(store);
  if (virtualCategory) return virtualCategory;
  if (
    !hasVisibleV3Product ||
    !persistedCategory ||
    persistedCategory.storeId !== store.id
  ) {
    return null;
  }
  return persistedCategory;
}

export function isCatalogCategoryVisibleV3(
  store: CatalogVisibilityStore,
  categoryName: string
): boolean {
  if (store.launchStatus === "LIVE") return true;
  const intent = resolveNicheIntentV1({ niche: store.niche });
  const ontology = ontologyEntryForClass(intent.productClass);
  if (!ontology) return false;
  const normalized = categoryName.toLowerCase();
  if (normalized === ontology.category.name.toLowerCase()) return true;
  if (ontology.classConcepts.some((concept) => normalized.includes(concept))) return true;
  const headTokens = ontology.headNoun.toLowerCase().split(/\s+/);
  return (
    ontology.qualifiers.some((qualifier) => normalized.includes(qualifier)) &&
    headTokens.some((token) => normalized.includes(token.replace(/s$/, "")))
  );
}
