export const INTENT_VERSION = "niche-intent.v1" as const;
export const ONTOLOGY_VERSION = "product-ontology.v1" as const;
export const EVALUATOR_VERSION = "candidate-evaluator.v1" as const;
export const QUERY_PLAN_VERSION = "class-query-plan.v1" as const;
export const POLICY_VERSION = "generator-policy.v1" as const;
export const GENERATION_RESULT_VERSION = "generation-result.v1" as const;
export const PRODUCT_CLASS_PROFILE_VERSION = "product-class-profile.v1" as const;

export type GateState = "PASS" | "FAIL" | "UNKNOWN" | "REVIEW";
export type IntentPolicyDecision = "ALLOW" | "MANUAL_REVIEW_REQUIRED" | "BLOCK";

export interface ProductClassExclusionV1 {
  className: string;
  concepts: string[];
}

/**
 * Serializable product-class truth used by a single reviewed generation plan.
 *
 * Runtime profiles are deliberately provisional: confirming what the physical
 * product phrase means is not a compliance approval and can never enable live
 * or autonomous commerce. All authority-bearing fields are recomputed by the
 * server from the original input before a caller may use the profile.
 */
export interface ProductClassProfileV1 {
  version: typeof PRODUCT_CLASS_PROFILE_VERSION;
  source: "STATIC_ONTOLOGY" | "RUNTIME_PROVISIONAL";
  serverOwned: true;
  requiresAdminConfirmation: boolean;
  productClass: string;
  normalizedProductType: string;
  headNoun: string;
  classConcepts: string[];
  qualifiers: string[];
  excludedClasses: ProductClassExclusionV1[];
  policyDecision: IntentPolicyDecision;
  riskFlags: string[];
  category: { slug: string; name: string; description: string };
  liveCommerceAllowed: boolean;
  autonomousLaunchAllowed: boolean;
  profileHash: string;
}

export type RuntimeProductClassProposalV1 =
  | {
      status: "PROPOSED";
      profile: ProductClassProfileV1;
      reasonCodes: ["RUNTIME_PRODUCT_CLASS_CONFIRMATION_REQUIRED"];
      riskFlags: string[];
    }
  | {
      status: "AMBIGUOUS";
      profile: null;
      reasonCodes: string[];
      riskFlags: string[];
    }
  | {
      status: "BLOCKED";
      profile: null;
      reasonCodes: string[];
      riskFlags: string[];
    };

export interface EvidenceFieldV1 {
  field: "title" | "description" | "providerCategoryPath" | "specs" | "variants";
  value: string;
}

export interface NicheIntentV1 {
  version: typeof INTENT_VERSION;
  classifierVersion: typeof ONTOLOGY_VERSION;
  normalizedNiche: string;
  productClass: string | null;
  headNoun: string | null;
  requiredClassConcepts: string[];
  qualifiers: string[];
  allowedAdjacentClasses: string[];
  excludedProductClasses: string[];
  /** Complete exclusion evidence; evaluator must not re-resolve mutable ontology. */
  excludedClassRules: ProductClassExclusionV1[];
  excludedConcepts: string[];
  targetEndUser: string | null;
  riskFlags: string[];
  policyDecision: IntentPolicyDecision;
  confidence: number;
  evidence: string[];
  reasonCodes: string[];
  liveCommerceAllowed: boolean;
  autonomousLaunchAllowed: boolean;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

/**
 * Validate a persisted intent before it is trusted by the evaluator.
 *
 * Product candidates and products may outlive one server process, so a loose
 * type assertion here could turn an older or malformed JSON object into a
 * runtime exception—or silently drop the exclusions that keep a catalog on
 * class. Persisted dynamic profiles therefore use the same complete contract
 * as in-memory V3 intents.
 */
export function parseNicheIntentV1(value: unknown): NicheIntentV1 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<NicheIntentV1>;
  const validExclusionRules =
    Array.isArray(candidate.excludedClassRules) &&
    candidate.excludedClassRules.every(
      (entry) =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof entry.className === "string" &&
        isStringArray(entry.concepts)
    );

  if (
    candidate.version !== INTENT_VERSION ||
    candidate.classifierVersion !== ONTOLOGY_VERSION ||
    typeof candidate.normalizedNiche !== "string" ||
    (typeof candidate.productClass !== "string" && candidate.productClass !== null) ||
    (typeof candidate.headNoun !== "string" && candidate.headNoun !== null) ||
    !Number.isFinite(candidate.confidence) ||
    (candidate.confidence ?? -1) < 0 ||
    (candidate.confidence ?? 2) > 1 ||
    !isStringArray(candidate.requiredClassConcepts) ||
    !isStringArray(candidate.qualifiers) ||
    !isStringArray(candidate.allowedAdjacentClasses) ||
    !isStringArray(candidate.excludedProductClasses) ||
    !validExclusionRules ||
    !isStringArray(candidate.excludedConcepts) ||
    (typeof candidate.targetEndUser !== "string" && candidate.targetEndUser !== null) ||
    !isStringArray(candidate.riskFlags) ||
    !isStringArray(candidate.evidence) ||
    !isStringArray(candidate.reasonCodes) ||
    !["ALLOW", "MANUAL_REVIEW_REQUIRED", "BLOCK"].includes(
      candidate.policyDecision ?? ""
    ) ||
    typeof candidate.liveCommerceAllowed !== "boolean" ||
    typeof candidate.autonomousLaunchAllowed !== "boolean"
  ) {
    return null;
  }

  return candidate as NicheIntentV1;
}

export interface ClassQueryPlanV1 {
  version: typeof QUERY_PLAN_VERSION;
  productClass: string;
  queries: Array<{ query: string; classConcept: string; qualifier?: string }>;
  forbiddenMerchandisingOnlyTerms: string[];
}

export interface EvaluationGateV1 {
  state: GateState;
  reasonCodes: string[];
  explanation: string;
  evidence: EvidenceFieldV1[];
}

export interface CandidateEvaluationV1 {
  version: typeof EVALUATOR_VERSION;
  evaluatedAt: string;
  intentVersion: typeof INTENT_VERSION;
  productClass: string | null;
  relevance: EvaluationGateV1;
  policy: EvaluationGateV1;
  supplierEvidence: EvaluationGateV1;
  mediaReadiness: EvaluationGateV1;
  variantReadiness: EvaluationGateV1;
  priceMargin: EvaluationGateV1;
  shipping: EvaluationGateV1;
  riskIp: EvaluationGateV1;
  previewVisibility: EvaluationGateV1;
  liveCommerceEligibility: EvaluationGateV1;
}

export interface CandidateEvidenceInputV1 {
  title: string;
  description?: string | null;
  providerCategoryPath?: string | null;
  specs?: Array<{ label: string; value: string }>;
  variants?: Array<{ title?: string | null; optionSummary?: string | null }>;
  providerKey?: string | null;
  externalId?: string | null;
  sourceUrl?: string | null;
  storedMediaCount?: number;
  usableStoredMediaCount?: number;
  variantIdentityReady?: boolean | null;
  price?: number | null;
  marginPercent?: number | null;
  shippingDaysMax?: number | null;
  riskVeto?: boolean;
  groundedContentReady?: boolean;
}

export interface CandidateQualityFactsV1 {
  relevant: boolean;
  policyGate: GateState;
  usableStoredMediaCount: number;
  variantIdentityReady: boolean;
  groundedContentReady: boolean;
  hardRiskVeto: boolean;
  supplierProvenanceReady: boolean;
}

export interface PolicyOutcomeV1 {
  version: typeof POLICY_VERSION;
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  reasonCodes: string[];
  previewVisible: boolean;
  liveCommerceAllowed: boolean;
  autonomousLaunchAllowed: boolean;
}

export type GenerationTerminalStatusV1 =
  | "READY_FOR_PREVIEW"
  | "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW"
  | "POLICY_BLOCKED"
  | "INSUFFICIENT_RELEVANT_PRODUCTS"
  | "INSUFFICIENT_INTENT_EVIDENCE"
  | "PROVIDER_FAILED"
  | "VALIDATION_FAILED"
  | "CANCELLED";

export interface GenerationEvidenceV1 {
  intent: NicheIntentV1;
  providerFailed?: boolean;
  validationFailed?: boolean;
  cancelled?: boolean;
  minimumProducts: number;
  relevantProducts: number;
  previewVisibleProducts: number;
  importedProducts: number;
  importBudget: number;
}

export type GenerationResultV1 = {
  version: typeof GENERATION_RESULT_VERSION;
  status: GenerationTerminalStatusV1;
  previewReady: boolean;
  manualReviewRequired: boolean;
  liveCommerceAllowed: boolean;
  reasonCodes: string[];
  counts: {
    minimumProducts: number;
    relevantProducts: number;
    previewVisibleProducts: number;
    importedProducts: number;
    importBudget: number;
  };
};
