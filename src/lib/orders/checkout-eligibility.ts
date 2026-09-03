import {
  EVALUATOR_VERSION,
  INTENT_VERSION,
} from "@/lib/generator-v3/contracts";
import {
  FULFILLMENT_MODES,
  type FulfillmentMode,
} from "@/lib/orders/types";

export type CheckoutEligibilityMode = "LIVE" | "MOCK";

export type CheckoutEligibilityReasonCode =
  | "STORE_INACTIVE"
  | "STORE_NOT_LIVE"
  | "STORE_COMMERCE_EVIDENCE_MISSING"
  | "STORE_COMMERCE_NOT_ALLOWED"
  | "STORE_HUMAN_APPROVAL_MISSING"
  | "STORE_MANUAL_REVIEW_NOT_APPROVED"
  | "PRODUCT_UNPUBLISHED"
  | "CATALOG_VISIBILITY_NOT_PASS"
  | "PRODUCT_MEDIA_NOT_READY"
  | "PRODUCT_QUALITY_NOT_READY"
  | "PRODUCT_LIVE_EVIDENCE_MISSING"
  | "PRODUCT_LIVE_EVIDENCE_INVALID"
  | "PRODUCT_LIVE_EVIDENCE_NOT_PASS"
  | "CONTRIBUTION_MARGIN_FLOOR_INVALID"
  | "CONTRIBUTION_MARGIN_INVALID"
  | "CONTRIBUTION_MARGIN_BELOW_FLOOR";

interface StoreGenerationCommerceEvidence {
  status: string;
  liveCommerceAllowed: boolean;
  manualReviewRequired: boolean;
  manualReviewStatus: string;
  humanLaunchApproved: boolean;
}

export interface CheckoutCommerceEligibilityInput {
  mode: CheckoutEligibilityMode;
  store: {
    isActive: boolean;
    launchStatus: string;
    generation: StoreGenerationCommerceEvidence | null;
  };
  product: {
    isPublished: boolean;
    catalogVisible: boolean;
    mediaStatus: string;
    qualityStatus: string;
    supplierDataJson: string;
  };
  contributionMarginPercent: number;
  minimumContributionMarginPercent: number;
}

export interface CheckoutCommerceEligibilityDecision {
  allowed: boolean;
  reasonCodes: CheckoutEligibilityReasonCode[];
}

const LIVE_GENERATION_STATES = new Set([
  "READY_FOR_PREVIEW",
  "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
]);

const LIVE_QUALITY_STATES = new Set(["READY", "PASS"]);

const NON_POLICY_PASS_GATES = [
  "relevance",
  "supplierEvidence",
  "mediaReadiness",
  "variantReadiness",
  "priceMargin",
  "shipping",
  "riskIp",
  "previewVisibility",
] as const;

const MANUAL_POLICY_REASON = "POLICY_MANUAL_REVIEW_REQUIRED";
const AGGREGATE_LIVE_FAILURE_REASON = "LIVE_COMMERCE_GATE_FAILED";

/** Unknown database values must never silently become a live fulfillment mode. */
export function parseFulfillmentModeStrict(value: string): FulfillmentMode | null {
  return (FULFILLMENT_MODES as readonly string[]).includes(value)
    ? (value as FulfillmentMode)
    : null;
}

/**
 * Pure, fail-closed gate used immediately before checkout lines are prepared.
 * MOCK deliberately skips live-only generation/evidence/margin requirements;
 * its caller still requires an active store, a published product and catalog
 * visibility, and the mock action never persists or fulfills the result.
 */
export function evaluateCheckoutCommerceEligibility(
  input: CheckoutCommerceEligibilityInput
): CheckoutCommerceEligibilityDecision {
  const reasonCodes: CheckoutEligibilityReasonCode[] = [];

  if (!input.store.isActive) reasonCodes.push("STORE_INACTIVE");
  if (!input.product.isPublished) reasonCodes.push("PRODUCT_UNPUBLISHED");
  if (!input.product.catalogVisible) {
    reasonCodes.push("CATALOG_VISIBILITY_NOT_PASS");
  }

  if (reasonCodes.length > 0 || input.mode === "MOCK") {
    return { allowed: reasonCodes.length === 0, reasonCodes };
  }

  if (input.store.launchStatus !== "LIVE") {
    reasonCodes.push("STORE_NOT_LIVE");
  }

  const generation = input.store.generation;
  if (!generation || !LIVE_GENERATION_STATES.has(generation.status)) {
    reasonCodes.push("STORE_COMMERCE_EVIDENCE_MISSING");
  } else {
    if (!generation.liveCommerceAllowed) {
      reasonCodes.push("STORE_COMMERCE_NOT_ALLOWED");
    }
    if (!generation.humanLaunchApproved) {
      reasonCodes.push("STORE_HUMAN_APPROVAL_MISSING");
    }
    if (
      generation.manualReviewRequired &&
      generation.manualReviewStatus !== "APPROVED"
    ) {
      reasonCodes.push("STORE_MANUAL_REVIEW_NOT_APPROVED");
    }
  }

  if (input.product.mediaStatus !== "OK") {
    reasonCodes.push("PRODUCT_MEDIA_NOT_READY");
  }
  if (!LIVE_QUALITY_STATES.has(input.product.qualityStatus)) {
    reasonCodes.push("PRODUCT_QUALITY_NOT_READY");
  }

  const evaluationResult = inspectPersistedLiveEvaluation(
    input.product.supplierDataJson,
    Boolean(
      generation?.liveCommerceAllowed &&
        generation.humanLaunchApproved &&
        generation.manualReviewRequired &&
        generation.manualReviewStatus === "APPROVED"
    )
  );
  if (evaluationResult) reasonCodes.push(evaluationResult);

  if (
    !Number.isFinite(input.minimumContributionMarginPercent) ||
    input.minimumContributionMarginPercent < 0 ||
    input.minimumContributionMarginPercent > 95
  ) {
    reasonCodes.push("CONTRIBUTION_MARGIN_FLOOR_INVALID");
  } else if (!Number.isFinite(input.contributionMarginPercent)) {
    reasonCodes.push("CONTRIBUTION_MARGIN_INVALID");
  } else if (
    input.contributionMarginPercent < input.minimumContributionMarginPercent
  ) {
    reasonCodes.push("CONTRIBUTION_MARGIN_BELOW_FLOOR");
  }

  return { allowed: reasonCodes.length === 0, reasonCodes };
}

function inspectPersistedLiveEvaluation(
  rawSupplierData: string,
  approvedManualReviewOverlay: boolean
): CheckoutEligibilityReasonCode | null {
  let supplierData: unknown;
  try {
    supplierData = JSON.parse(rawSupplierData);
  } catch {
    return "PRODUCT_LIVE_EVIDENCE_INVALID";
  }

  if (!isObject(supplierData)) {
    return "PRODUCT_LIVE_EVIDENCE_INVALID";
  }
  const evaluation = supplierData.candidateEvaluationV1;
  if (evaluation == null) return "PRODUCT_LIVE_EVIDENCE_MISSING";
  if (!isObject(evaluation)) return "PRODUCT_LIVE_EVIDENCE_INVALID";

  if (
    evaluation.version !== EVALUATOR_VERSION ||
    evaluation.intentVersion !== INTENT_VERSION ||
    typeof evaluation.evaluatedAt !== "string" ||
    !Number.isFinite(Date.parse(evaluation.evaluatedAt)) ||
    typeof evaluation.productClass !== "string" ||
    evaluation.productClass.trim().length === 0
  ) {
    return "PRODUCT_LIVE_EVIDENCE_INVALID";
  }

  const allNonPolicyGatesPass = NON_POLICY_PASS_GATES.every((key) => {
    const gate = evaluation[key];
    return isObject(gate) && gate.state === "PASS";
  });

  const policy = evaluation.policy;
  const liveCommerce = evaluation.liveCommerceEligibility;
  const normalLivePass =
    allNonPolicyGatesPass &&
    isObject(policy) &&
    policy.state === "PASS" &&
    isObject(liveCommerce) &&
    liveCommerce.state === "PASS";
  if (normalLivePass) return null;

  const approvedManualPolicyReview =
    approvedManualReviewOverlay &&
    allNonPolicyGatesPass &&
    isManualPolicyReviewOnly(policy) &&
    isExpectedAggregatePolicyFailure(liveCommerce);

  return approvedManualPolicyReview
    ? null
    : "PRODUCT_LIVE_EVIDENCE_NOT_PASS";
}

function isManualPolicyReviewOnly(value: unknown): boolean {
  if (!isObject(value) || value.state !== "REVIEW") return false;
  const reasonCodes = value.reasonCodes;
  return (
    Array.isArray(reasonCodes) &&
    reasonCodes.length > 0 &&
    reasonCodes.every(
      (reason) => reason === MANUAL_POLICY_REASON
    )
  );
}

function isExpectedAggregatePolicyFailure(value: unknown): boolean {
  if (!isObject(value) || value.state !== "FAIL") return false;
  const reasonCodes = value.reasonCodes;
  return (
    Array.isArray(reasonCodes) &&
    reasonCodes.length > 0 &&
    reasonCodes.every(
      (reason) => reason === AGGREGATE_LIVE_FAILURE_REASON
    )
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
