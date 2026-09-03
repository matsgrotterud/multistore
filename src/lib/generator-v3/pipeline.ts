import type {
  CandidateEvidenceInputV1,
  CandidateEvaluationV1,
  ClassQueryPlanV1,
  GenerationResultV1,
  NicheIntentV1,
  PolicyOutcomeV1,
} from "./contracts";
import {
  buildClassQueryPlanV1,
  buildGenerationResultV1,
  decideCandidatePolicyV1,
  evaluateCandidateV1,
  resolveNicheIntentV1,
} from "./core";

export const GENERATOR_PIPELINE_VERSION = "generator-pipeline.v1" as const;

type ProviderEvidenceV1 = Omit<
  CandidateEvidenceInputV1,
  | "providerKey"
  | "externalId"
  | "storedMediaCount"
  | "usableStoredMediaCount"
>;

/** Provider output before media is copied into durable storage. */
export interface PipelineCandidateV1 {
  providerKey: string;
  externalId: string;
  evidence: ProviderEvidenceV1;
}

export interface PipelineSearchInputV1 {
  tenantId: string;
  idempotencyKey: string;
  query: ClassQueryPlanV1["queries"][number];
  queryIndex: number;
  categoryKey: string;
  limit: number;
}

export interface GeneratorProviderAdapterV1 {
  search(input: PipelineSearchInputV1): Promise<readonly PipelineCandidateV1[]>;
}

/**
 * An implementation must either return a complete per-candidate staging receipt
 * or reject without leaking a visible media reference.
 */
export interface GeneratorMediaAdapterV1 {
  stage(input: {
    tenantId: string;
    idempotencyKey: string;
    candidate: PipelineCandidateV1;
  }): Promise<PipelineMediaReceiptV1>;
  discard(input: {
    tenantId: string;
    idempotencyKey: string;
    receipts: readonly PipelineMediaReceiptV1[];
  }): Promise<void>;
}

export interface PipelineMediaReceiptV1 {
  candidateKey: string;
  usableStoredMediaCount: number;
  storageRefs: readonly string[];
}

export interface PipelineProductCommitV1 {
  candidateKey: string;
  providerKey: string;
  externalId: string;
  /** First deterministic query/category that discovered this external product. */
  categoryKey: string;
  evaluation: CandidateEvaluationV1;
  policy: PolicyOutcomeV1;
  media: PipelineMediaReceiptV1;
  previewVisible: true;
  isPublished: false;
  noindex: true;
  liveCommerceAllowed: false;
}

export interface PipelineCommitInputV1 {
  tenantId: string;
  idempotencyKey: string;
  intent: NicheIntentV1;
  queryPlan: ClassQueryPlanV1;
  result: GenerationResultV1;
  products: readonly PipelineProductCommitV1[];
  store: {
    launchStatus: "PREVIEW";
    noindex: true;
    liveCommerceAllowed: false;
  };
}

export interface PipelineCommitReceiptV1 {
  tenantId: string;
  idempotencyKey: string;
  storeId: string;
  result: GenerationResultV1;
  products: readonly PipelineProductCommitV1[];
}

export type PipelineCommitOutcomeV1 =
  | { kind: "COMMITTED"; receipt: PipelineCommitReceiptV1 }
  | { kind: "EXISTING"; receipt: PipelineCommitReceiptV1 };

/**
 * `commitPreview` is the only visible-write boundary and must be atomic. A
 * rejected call must not leave a visible Store/Product. The tenant and
 * idempotency key form the uniqueness scope.
 */
export interface GeneratorPersistenceAdapterV1 {
  findCommitted(input: {
    tenantId: string;
    idempotencyKey: string;
  }): Promise<PipelineCommitReceiptV1 | null>;
  commitPreview(input: PipelineCommitInputV1): Promise<PipelineCommitOutcomeV1>;
}

export interface GeneratorPipelineAdaptersV1 {
  provider: GeneratorProviderAdapterV1;
  media: GeneratorMediaAdapterV1;
  persistence: GeneratorPersistenceAdapterV1;
}

export interface RunGeneratorPipelineInputV1 {
  tenantId: string;
  idempotencyKey: string;
  intentInput: unknown;
  minimumProducts: number;
  importBudget: number;
  /** Stable integration-owned category mapping; query text is never evidence. */
  categoryByClassConcept?: Readonly<Record<string, string>>;
}

export interface PipelineQueryAttemptV1 {
  queryIndex: number;
  query: string;
  classConcept: string;
  categoryKey: string;
  discovered: number;
}

export interface PipelineCandidateDecisionV1 {
  candidateKey: string;
  categoryKey: string;
  relevance: CandidateEvaluationV1["relevance"]["state"];
  policy: PolicyOutcomeV1["decision"] | "NOT_EVALUATED";
  reasonCodes: string[];
}

export interface GeneratorPipelineExecutionV1 {
  version: typeof GENERATOR_PIPELINE_VERSION;
  tenantId: string;
  idempotencyKey: string;
  replayed: boolean;
  storeId: string | null;
  intent: NicheIntentV1;
  queryPlan: ClassQueryPlanV1;
  result: GenerationResultV1;
  queryAttempts: PipelineQueryAttemptV1[];
  candidateDecisions: PipelineCandidateDecisionV1[];
  products: readonly PipelineProductCommitV1[];
}

interface DiscoveredCandidateV1 {
  candidate: PipelineCandidateV1;
  candidateKey: string;
  categoryKey: string;
}

/**
 * Adapter-driven reference pipeline for Generator V3.
 *
 * No store/product is visible until every hard gate passes and the persistence
 * adapter accepts one atomic PREVIEW commit. Retrieval queries and merchandising
 * categories are intentionally absent from evaluator input.
 */
export async function runGeneratorPipelineV1(
  input: RunGeneratorPipelineInputV1,
  adapters: GeneratorPipelineAdaptersV1
): Promise<GeneratorPipelineExecutionV1> {
  const tenantId = input.tenantId.trim();
  const idempotencyKey = input.idempotencyKey.trim();
  const intent = resolveNicheIntentV1(input.intentInput);
  const queryPlan = buildClassQueryPlanV1(intent);
  const base = {
    version: GENERATOR_PIPELINE_VERSION,
    tenantId,
    idempotencyKey,
    intent,
    queryPlan,
  } as const;

  if (!validRunInput(input, tenantId, idempotencyKey)) {
    return {
      ...base,
      replayed: false,
      storeId: null,
      result: previewOnlyResult(
        buildGenerationResultV1({
          intent,
          validationFailed: true,
          minimumProducts: normalizedCount(input.minimumProducts),
          relevantProducts: 0,
          previewVisibleProducts: 0,
          importedProducts: 0,
          importBudget: normalizedCount(input.importBudget),
        })
      ),
      queryAttempts: [],
      candidateDecisions: [],
      products: [],
    };
  }

  const existing = await adapters.persistence.findCommitted({ tenantId, idempotencyKey });
  if (existing) {
    if (!receiptMatches(existing, tenantId, idempotencyKey)) {
      return invalidPersistenceReceipt(base, input);
    }
    return executionFromReceipt(base, existing, true);
  }

  if (!intent.productClass || queryPlan.queries.length === 0) {
    return {
      ...base,
      replayed: false,
      storeId: null,
      result: previewOnlyResult(
        buildGenerationResultV1({
          intent,
          minimumProducts: input.minimumProducts,
          relevantProducts: 0,
          previewVisibleProducts: 0,
          importedProducts: 0,
          importBudget: input.importBudget,
        })
      ),
      queryAttempts: [],
      candidateDecisions: [],
      products: [],
    };
  }

  const queryAttempts: PipelineQueryAttemptV1[] = [];
  const discovered = new Map<string, DiscoveredCandidateV1>();

  try {
    for (const [queryIndex, query] of queryPlan.queries.entries()) {
      const categoryKey =
        input.categoryByClassConcept?.[query.classConcept]?.trim() || query.classConcept;
      const rows = await adapters.provider.search({
        tenantId,
        idempotencyKey,
        query,
        queryIndex,
        categoryKey,
        limit: input.importBudget,
      });
      queryAttempts.push({
        queryIndex,
        query: query.query,
        classConcept: query.classConcept,
        categoryKey,
        discovered: rows.length,
      });

      // First deterministic query/category wins. Later duplicate external IDs
      // never recategorize the product.
      for (const candidate of rows) {
        const candidateKey = externalCandidateKey(candidate);
        if (!candidateKey || discovered.has(candidateKey)) continue;
        discovered.set(candidateKey, { candidate, candidateKey, categoryKey });
      }
    }
  } catch {
    return {
      ...base,
      replayed: false,
      storeId: null,
      result: previewOnlyResult(
        buildGenerationResultV1({
          intent,
          providerFailed: true,
          minimumProducts: input.minimumProducts,
          relevantProducts: 0,
          previewVisibleProducts: 0,
          importedProducts: 0,
          importBudget: input.importBudget,
        })
      ),
      queryAttempts,
      candidateDecisions: [],
      products: [],
    };
  }

  const staged: PipelineMediaReceiptV1[] = [];
  const products: PipelineProductCommitV1[] = [];
  const candidateDecisions: PipelineCandidateDecisionV1[] = [];
  let relevantProducts = 0;

  try {
    for (const row of discovered.values()) {
      const preliminary = evaluateCandidateV1(
        intent,
        evaluatorInput(row.candidate, 0)
      );
      if (preliminary.relevance.state !== "PASS") {
        candidateDecisions.push({
          candidateKey: row.candidateKey,
          categoryKey: row.categoryKey,
          relevance: preliminary.relevance.state,
          policy: "NOT_EVALUATED",
          reasonCodes: sortedUnique(preliminary.relevance.reasonCodes),
        });
        continue;
      }

      relevantProducts += 1;
      if (products.length >= input.importBudget) {
        candidateDecisions.push({
          candidateKey: row.candidateKey,
          categoryKey: row.categoryKey,
          relevance: "PASS",
          policy: "NOT_EVALUATED",
          reasonCodes: ["IMPORT_BUDGET_REACHED"],
        });
        continue;
      }

      const media = await adapters.media.stage({
        tenantId,
        idempotencyKey,
        candidate: row.candidate,
      });
      staged.push(media);
      assertValidMediaReceipt(media, row.candidateKey);
      const evaluation = evaluateCandidateV1(
        intent,
        evaluatorInput(row.candidate, media.usableStoredMediaCount)
      );
      const policy = decideCandidatePolicyV1(evaluation, {
        relevant: evaluation.relevance.state === "PASS",
        policyGate: evaluation.policy.state,
        usableStoredMediaCount: media.usableStoredMediaCount,
        variantIdentityReady: row.candidate.evidence.variantIdentityReady === true,
        groundedContentReady: row.candidate.evidence.groundedContentReady === true,
        hardRiskVeto: row.candidate.evidence.riskVeto === true,
        supplierProvenanceReady: Boolean(
          row.candidate.providerKey.trim() &&
            row.candidate.externalId.trim() &&
            row.candidate.evidence.sourceUrl?.trim()
        ),
      });
      candidateDecisions.push({
        candidateKey: row.candidateKey,
        categoryKey: row.categoryKey,
        relevance: evaluation.relevance.state,
        policy: policy.decision,
        reasonCodes: sortedUnique([
          ...evaluation.relevance.reasonCodes,
          ...policy.reasonCodes,
        ]),
      });
      if (!policy.previewVisible || policy.decision === "BLOCK") {
        staged.pop();
        await discardQuietly(adapters.media, tenantId, idempotencyKey, [media]);
        continue;
      }

      products.push({
        candidateKey: row.candidateKey,
        providerKey: row.candidate.providerKey.trim().toLowerCase(),
        externalId: row.candidate.externalId.trim(),
        categoryKey: row.categoryKey,
        evaluation,
        policy,
        media,
        previewVisible: true,
        isPublished: false,
        noindex: true,
        liveCommerceAllowed: false,
      });
    }
  } catch {
    await discardQuietly(adapters.media, tenantId, idempotencyKey, staged);
    return {
      ...base,
      replayed: false,
      storeId: null,
      result: previewOnlyResult(
        buildGenerationResultV1({
          intent,
          validationFailed: true,
          minimumProducts: input.minimumProducts,
          relevantProducts,
          previewVisibleProducts: 0,
          importedProducts: 0,
          importBudget: input.importBudget,
        })
      ),
      queryAttempts,
      candidateDecisions,
      products: [],
    };
  }

  if (products.length < input.minimumProducts) {
    await discardQuietly(adapters.media, tenantId, idempotencyKey, staged);
    return {
      ...base,
      replayed: false,
      storeId: null,
      result: previewOnlyResult(
        buildGenerationResultV1({
          intent,
          minimumProducts: input.minimumProducts,
          relevantProducts,
          previewVisibleProducts: 0,
          importedProducts: 0,
          importBudget: input.importBudget,
        })
      ),
      queryAttempts,
      candidateDecisions,
      products: [],
    };
  }

  const desiredResult = previewOnlyResult(
    buildGenerationResultV1({
      intent,
      minimumProducts: input.minimumProducts,
      relevantProducts,
      previewVisibleProducts: products.length,
      importedProducts: products.length,
      importBudget: input.importBudget,
    })
  );

  try {
    const outcome = await adapters.persistence.commitPreview({
      tenantId,
      idempotencyKey,
      intent,
      queryPlan,
      result: desiredResult,
      products,
      store: {
        launchStatus: "PREVIEW",
        noindex: true,
        liveCommerceAllowed: false,
      },
    });
    if (!receiptMatches(outcome.receipt, tenantId, idempotencyKey)) {
      await discardQuietly(adapters.media, tenantId, idempotencyKey, staged);
      return invalidPersistenceReceipt(base, input, queryAttempts, candidateDecisions);
    }
    if (outcome.kind === "EXISTING") {
      await discardQuietly(adapters.media, tenantId, idempotencyKey, staged);
    }
    return {
      ...executionFromReceipt(base, outcome.receipt, outcome.kind === "EXISTING"),
      queryAttempts,
      candidateDecisions,
    };
  } catch {
    await discardQuietly(adapters.media, tenantId, idempotencyKey, staged);
    return {
      ...base,
      replayed: false,
      storeId: null,
      result: previewOnlyResult(
        buildGenerationResultV1({
          intent,
          validationFailed: true,
          minimumProducts: input.minimumProducts,
          relevantProducts,
          previewVisibleProducts: 0,
          importedProducts: 0,
          importBudget: input.importBudget,
        })
      ),
      queryAttempts,
      candidateDecisions,
      products: [],
    };
  }
}

function evaluatorInput(
  candidate: PipelineCandidateV1,
  usableStoredMediaCount: number
): CandidateEvidenceInputV1 {
  const evidence = candidate.evidence;
  // Explicit projection is a provenance boundary: a provider cannot smuggle a
  // retrieval query, generated category, score, or merchandising copy into the
  // relevance evaluator via an extra runtime property.
  return {
    title: typeof evidence.title === "string" ? evidence.title : "",
    description:
      typeof evidence.description === "string" ? evidence.description : null,
    providerCategoryPath:
      typeof evidence.providerCategoryPath === "string"
        ? evidence.providerCategoryPath
        : null,
    specs: Array.isArray(evidence.specs) ? evidence.specs : [],
    variants: Array.isArray(evidence.variants) ? evidence.variants : [],
    providerKey: candidate.providerKey,
    externalId: candidate.externalId,
    sourceUrl: evidence.sourceUrl,
    storedMediaCount: usableStoredMediaCount,
    usableStoredMediaCount,
    variantIdentityReady: evidence.variantIdentityReady,
    price: evidence.price,
    marginPercent: evidence.marginPercent,
    shippingDaysMax: evidence.shippingDaysMax,
    riskVeto: evidence.riskVeto,
    groundedContentReady: evidence.groundedContentReady,
  };
}

function externalCandidateKey(candidate: PipelineCandidateV1): string | null {
  const providerKey = candidate.providerKey.trim().toLowerCase();
  const externalId = candidate.externalId.trim();
  return providerKey && externalId ? `${providerKey}:${externalId}` : null;
}

function assertValidMediaReceipt(
  receipt: PipelineMediaReceiptV1,
  expectedCandidateKey: string
): void {
  if (
    receipt.candidateKey !== expectedCandidateKey ||
    !Number.isInteger(receipt.usableStoredMediaCount) ||
    receipt.usableStoredMediaCount < 0 ||
    !Array.isArray(receipt.storageRefs) ||
    receipt.storageRefs.some((reference) => typeof reference !== "string" || !reference.trim())
  ) {
    throw new Error("Media adapter returned an invalid or cross-candidate receipt.");
  }
}

function validRunInput(
  input: RunGeneratorPipelineInputV1,
  tenantId: string,
  idempotencyKey: string
): boolean {
  return Boolean(
    tenantId &&
      idempotencyKey &&
      Number.isInteger(input.minimumProducts) &&
      input.minimumProducts > 0 &&
      Number.isInteger(input.importBudget) &&
      input.importBudget > 0 &&
      input.minimumProducts <= input.importBudget
  );
}

function normalizedCount(value: number): number {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function previewOnlyResult(result: GenerationResultV1): GenerationResultV1 {
  // Generation proves PREVIEW readiness only. LIVE remains a separate,
  // evidence-backed human transition even for a low-risk product class.
  return { ...result, liveCommerceAllowed: false };
}

function receiptMatches(
  receipt: PipelineCommitReceiptV1,
  tenantId: string,
  idempotencyKey: string
): boolean {
  return receipt.tenantId === tenantId && receipt.idempotencyKey === idempotencyKey;
}

function executionFromReceipt(
  base: Pick<
    GeneratorPipelineExecutionV1,
    "version" | "tenantId" | "idempotencyKey" | "intent" | "queryPlan"
  >,
  receipt: PipelineCommitReceiptV1,
  replayed: boolean
): GeneratorPipelineExecutionV1 {
  return {
    ...base,
    replayed,
    storeId: receipt.storeId,
    result: previewOnlyResult(receipt.result),
    queryAttempts: [],
    candidateDecisions: [],
    products: receipt.products,
  };
}

function invalidPersistenceReceipt(
  base: Pick<
    GeneratorPipelineExecutionV1,
    "version" | "tenantId" | "idempotencyKey" | "intent" | "queryPlan"
  >,
  input: Pick<RunGeneratorPipelineInputV1, "minimumProducts" | "importBudget">,
  queryAttempts: PipelineQueryAttemptV1[] = [],
  candidateDecisions: PipelineCandidateDecisionV1[] = []
): GeneratorPipelineExecutionV1 {
  return {
    ...base,
    replayed: false,
    storeId: null,
    result: previewOnlyResult(
      buildGenerationResultV1({
        intent: base.intent,
        validationFailed: true,
        minimumProducts: normalizedCount(input.minimumProducts),
        relevantProducts: 0,
        previewVisibleProducts: 0,
        importedProducts: 0,
        importBudget: normalizedCount(input.importBudget),
      })
    ),
    queryAttempts,
    candidateDecisions,
    products: [],
  };
}

async function discardQuietly(
  media: GeneratorMediaAdapterV1,
  tenantId: string,
  idempotencyKey: string,
  receipts: readonly PipelineMediaReceiptV1[]
): Promise<void> {
  if (receipts.length === 0) return;
  try {
    await media.discard({ tenantId, idempotencyKey, receipts });
  } catch {
    // Cleanup failure cannot make an incomplete store visible. Production
    // adapters should audit/retry storage garbage collection separately.
  }
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
