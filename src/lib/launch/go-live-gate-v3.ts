/**
 * Pure, fail-closed launch transition policy for Generator V3 stores.
 *
 * This module deliberately performs no I/O and does not mutate launch status.
 * Callers must persist a LIVE transition only when `allowed` and
 * `shouldTransition` are both true.
 */

export const GO_LIVE_GATE_VERSION = "go-live-gate.v3.0.0" as const;
export const GO_LIVE_EVIDENCE_VERSION = "go-live-evidence.v3" as const;
export const GENERATION_RESULT_CONTRACT_VERSION = "generation-result.v1" as const;

export const GENERATION_TERMINAL_STATES = [
  "READY_FOR_PREVIEW",
  "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
  "POLICY_BLOCKED",
  "INSUFFICIENT_RELEVANT_PRODUCTS",
  "INSUFFICIENT_INTENT_EVIDENCE",
  "PROVIDER_FAILED",
  "VALIDATION_FAILED",
  "CANCELLED",
] as const;

export type GenerationTerminalState = (typeof GENERATION_TERMINAL_STATES)[number];
export type LaunchEvidenceStatus = "PASS" | "FAIL" | "UNKNOWN" | "REVIEW";

export interface VerifiedLaunchEvidenceV3 {
  status: LaunchEvidenceStatus;
  /** Stable references to the facts, checks, or persisted evaluations used. */
  evidenceRefs: readonly string[];
  verifiedBy: string | null;
  verifiedAt: string | null;
}

export interface GenerationLaunchEvidenceV3 {
  contractVersion: string | null;
  terminalState: GenerationTerminalState | string | null;
  /**
   * Persisted server-owned product-class provenance. Runtime-provisional
   * classes are intentionally preview-only until a separately reviewed class
   * is promoted into the static ontology.
   */
  productClassProfileSource: "STATIC_ONTOLOGY" | "RUNTIME_PROVISIONAL" | null;
  runId: string | null;
  generatorVersion: string | null;
  ontologyVersion: string | null;
  evaluatorVersion: string | null;
  completedAt: string | null;
}

export interface ManualReviewEvidenceV3 {
  required: boolean | null;
  status: "NOT_REQUIRED" | "APPROVED" | "REJECTED" | "PENDING" | "UNKNOWN";
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface HumanLaunchApprovalV3 {
  approved: boolean;
  approvalKind: "HUMAN" | string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface CatalogLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  minimumProductCount: number | null;
  previewVisibleProductCount: number | null;
  previewComplete: boolean | null;
}

export interface RelevanceLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  evaluatedVisibleProductCount: number | null;
  failedVisibleProductCount: number | null;
  unknownVisibleProductCount: number | null;
}

export interface MediaLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  usableVisibleProductCount: number | null;
  failedVisibleProductCount: number | null;
  unknownVisibleProductCount: number | null;
}

export interface ContentLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  grounded: boolean | null;
  unverifiedClaimsPresent: boolean | null;
}

export interface ComplianceLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  policyPagesPresent: boolean | null;
  requiredDisclosuresPresent: boolean | null;
  unresolvedFlagCount: number | null;
}

export interface DomainLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  hostname: string | null;
  ownershipVerified: boolean | null;
  dnsReady: boolean | null;
  tlsReady: boolean | null;
  canonicalConfigured: boolean | null;
}

export interface CommerceLaunchEvidenceV3 extends VerifiedLaunchEvidenceV3 {
  checkoutReady: boolean | null;
  paymentReady: boolean | null;
  orderRoutingReady: boolean | null;
  fulfillmentReady: boolean | null;
  shippingReady: boolean | null;
  returnsReady: boolean | null;
  taxDecisionRecorded: boolean | null;
}

export interface GoLiveGateInputV3 {
  currentLaunchStatus: string | null;
  evidenceVersion: string | null;
  generation: GenerationLaunchEvidenceV3 | null;
  manualReview: ManualReviewEvidenceV3 | null;
  humanApproval: HumanLaunchApprovalV3 | null;
  catalog: CatalogLaunchEvidenceV3 | null;
  relevance: RelevanceLaunchEvidenceV3 | null;
  media: MediaLaunchEvidenceV3 | null;
  content: ContentLaunchEvidenceV3 | null;
  compliance: ComplianceLaunchEvidenceV3 | null;
  domain: DomainLaunchEvidenceV3 | null;
  commerce: CommerceLaunchEvidenceV3 | null;
}

export type GoLiveGateIdV3 =
  | "transition"
  | "v3-evidence"
  | "generation"
  | "manual-review"
  | "human-approval"
  | "catalog"
  | "relevance"
  | "media"
  | "content"
  | "compliance"
  | "domain"
  | "commerce";

export type GoLiveBlockReasonCodeV3 =
  | "INPUT_MISSING"
  | "ALREADY_LIVE_NO_TRANSITION"
  | "CURRENT_STATUS_UNKNOWN"
  | "CURRENT_STATUS_NOT_PREVIEW"
  | "V3_EVIDENCE_MISSING"
  | "GENERATION_EVIDENCE_MISSING"
  | "GENERATION_CONTRACT_INVALID"
  | "GENERATION_STATE_MISSING"
  | "GENERATION_STATE_NOT_LAUNCHABLE"
  | "GENERATION_PRODUCT_CLASS_PREVIEW_ONLY"
  | "GENERATION_PROVENANCE_MISSING"
  | "GENERATION_COMPLETION_INVALID"
  | "MANUAL_REVIEW_EVIDENCE_MISSING"
  | "MANUAL_REVIEW_REQUIRED"
  | "MANUAL_REVIEW_PENDING"
  | "MANUAL_REVIEW_REJECTED"
  | "MANUAL_REVIEW_METADATA_INVALID"
  | "HUMAN_APPROVAL_MISSING"
  | "HUMAN_APPROVAL_NOT_GRANTED"
  | "HUMAN_APPROVAL_NOT_HUMAN"
  | "HUMAN_APPROVAL_METADATA_INVALID"
  | "CATALOG_EVIDENCE_MISSING"
  | "CATALOG_UNKNOWN"
  | "CATALOG_FAILED"
  | "CATALOG_REVIEW_REQUIRED"
  | "CATALOG_PASS_UNVERIFIED"
  | "CATALOG_COUNTS_UNKNOWN"
  | "CATALOG_COUNTS_INVALID"
  | "CATALOG_MINIMUM_NOT_MET"
  | "PREVIEW_CATALOG_INCOMPLETE"
  | "RELEVANCE_EVIDENCE_MISSING"
  | "RELEVANCE_UNKNOWN"
  | "RELEVANCE_FAILED"
  | "RELEVANCE_REVIEW_REQUIRED"
  | "RELEVANCE_PASS_UNVERIFIED"
  | "RELEVANCE_COUNTS_UNKNOWN"
  | "RELEVANCE_COUNTS_INVALID"
  | "RELEVANCE_FAILED_VISIBLE_PRODUCTS"
  | "RELEVANCE_UNKNOWN_VISIBLE_PRODUCTS"
  | "RELEVANCE_COVERAGE_INCOMPLETE"
  | "MEDIA_EVIDENCE_MISSING"
  | "MEDIA_UNKNOWN"
  | "MEDIA_FAILED"
  | "MEDIA_REVIEW_REQUIRED"
  | "MEDIA_PASS_UNVERIFIED"
  | "MEDIA_COUNTS_UNKNOWN"
  | "MEDIA_COUNTS_INVALID"
  | "MEDIA_FAILED_VISIBLE_PRODUCTS"
  | "MEDIA_UNKNOWN_VISIBLE_PRODUCTS"
  | "MEDIA_COVERAGE_INCOMPLETE"
  | "CONTENT_EVIDENCE_MISSING"
  | "CONTENT_UNKNOWN"
  | "CONTENT_FAILED"
  | "CONTENT_REVIEW_REQUIRED"
  | "CONTENT_PASS_UNVERIFIED"
  | "CONTENT_NOT_GROUNDED"
  | "CONTENT_UNVERIFIED_CLAIMS"
  | "COMPLIANCE_EVIDENCE_MISSING"
  | "COMPLIANCE_UNKNOWN"
  | "COMPLIANCE_FAILED"
  | "COMPLIANCE_REVIEW_REQUIRED"
  | "COMPLIANCE_PASS_UNVERIFIED"
  | "COMPLIANCE_POLICY_PAGES_MISSING"
  | "COMPLIANCE_DISCLOSURES_MISSING"
  | "COMPLIANCE_FLAGS_UNRESOLVED"
  | "COMPLIANCE_FLAG_COUNT_INVALID"
  | "DOMAIN_EVIDENCE_MISSING"
  | "DOMAIN_UNKNOWN"
  | "DOMAIN_FAILED"
  | "DOMAIN_REVIEW_REQUIRED"
  | "DOMAIN_PASS_UNVERIFIED"
  | "DOMAIN_HOSTNAME_INVALID"
  | "DOMAIN_OWNERSHIP_UNVERIFIED"
  | "DOMAIN_DNS_NOT_READY"
  | "DOMAIN_TLS_NOT_READY"
  | "DOMAIN_CANONICAL_NOT_CONFIGURED"
  | "COMMERCE_EVIDENCE_MISSING"
  | "COMMERCE_UNKNOWN"
  | "COMMERCE_FAILED"
  | "COMMERCE_REVIEW_REQUIRED"
  | "COMMERCE_PASS_UNVERIFIED"
  | "COMMERCE_CHECKOUT_NOT_READY"
  | "COMMERCE_PAYMENT_NOT_READY"
  | "COMMERCE_ORDER_ROUTING_NOT_READY"
  | "COMMERCE_FULFILLMENT_NOT_READY"
  | "COMMERCE_SHIPPING_NOT_READY"
  | "COMMERCE_RETURNS_NOT_READY"
  | "COMMERCE_TAX_DECISION_MISSING";

export interface GoLiveGateReasonV3 {
  code: GoLiveBlockReasonCodeV3;
  gate: GoLiveGateIdV3;
  message: string;
}

export interface GoLiveGateDecisionV3 {
  gateVersion: typeof GO_LIVE_GATE_VERSION;
  decision: "ALLOW" | "BLOCK" | "NO_TRANSITION";
  /** True only when a PREVIEW -> LIVE write is permitted. */
  allowed: boolean;
  /** A second explicit guard for callers before performing a write. */
  shouldTransition: boolean;
  passedGates: GoLiveGateIdV3[];
  blockedGates: GoLiveGateIdV3[];
  reasons: GoLiveGateReasonV3[];
}

type EvidencePrefix =
  | "CATALOG"
  | "RELEVANCE"
  | "MEDIA"
  | "CONTENT"
  | "COMPLIANCE"
  | "DOMAIN"
  | "COMMERCE";

interface EvaluationContext {
  passedGates: GoLiveGateIdV3[];
  blockedGates: GoLiveGateIdV3[];
  reasons: GoLiveGateReasonV3[];
}

/**
 * Determine whether a caller may perform a PREVIEW -> LIVE transition.
 *
 * Missing, malformed, stale-by-contract, failed, unknown, or review-only
 * evidence blocks. The function never upgrades or downgrades an already LIVE
 * store; callers should treat NO_TRANSITION as a no-op.
 */
export function canTransitionToLive(
  input: GoLiveGateInputV3 | null | undefined
): GoLiveGateDecisionV3 {
  if (!input) {
    return blockedDecision([
      {
        code: "INPUT_MISSING",
        gate: "transition",
        message: "Go-live input is missing; no transition is permitted.",
      },
    ]);
  }

  if (input.currentLaunchStatus === "LIVE") {
    return {
      gateVersion: GO_LIVE_GATE_VERSION,
      decision: "NO_TRANSITION",
      allowed: false,
      shouldTransition: false,
      passedGates: [],
      blockedGates: ["transition"],
      reasons: [
        {
          code: "ALREADY_LIVE_NO_TRANSITION",
          gate: "transition",
          message: "Store is already LIVE; this gate will not mutate its existing status.",
        },
      ],
    };
  }

  const context: EvaluationContext = { passedGates: [], blockedGates: [], reasons: [] };

  evaluateGate(context, "transition", () => {
    if (!input.currentLaunchStatus) {
      addReason(
        context,
        "CURRENT_STATUS_UNKNOWN",
        "transition",
        "Current launch status is unknown."
      );
    } else if (input.currentLaunchStatus !== "PREVIEW") {
      addReason(
        context,
        "CURRENT_STATUS_NOT_PREVIEW",
        "transition",
        `Store must be PREVIEW before go-live; received '${input.currentLaunchStatus}'.`
      );
    }
  });

  evaluateGate(context, "v3-evidence", () => {
    if (input.evidenceVersion !== GO_LIVE_EVIDENCE_VERSION) {
      addReason(
        context,
        "V3_EVIDENCE_MISSING",
        "v3-evidence",
        `Verified ${GO_LIVE_EVIDENCE_VERSION} evidence is required; legacy or absent evidence cannot authorize go-live.`
      );
    }
  });

  evaluateGate(context, "generation", () => evaluateGeneration(input.generation, context));
  evaluateGate(context, "manual-review", () =>
    evaluateManualReview(input.generation, input.manualReview, context)
  );
  evaluateGate(context, "human-approval", () =>
    evaluateHumanApproval(input.humanApproval, context)
  );
  evaluateGate(context, "catalog", () => evaluateCatalog(input.catalog, context));
  evaluateGate(context, "relevance", () =>
    evaluateRelevance(input.relevance, input.catalog, context)
  );
  evaluateGate(context, "media", () => evaluateMedia(input.media, input.catalog, context));
  evaluateGate(context, "content", () => evaluateContent(input.content, context));
  evaluateGate(context, "compliance", () =>
    evaluateCompliance(input.compliance, context)
  );
  evaluateGate(context, "domain", () => evaluateDomain(input.domain, context));
  evaluateGate(context, "commerce", () => evaluateCommerce(input.commerce, context));

  const allowed = context.reasons.length === 0;
  return {
    gateVersion: GO_LIVE_GATE_VERSION,
    decision: allowed ? "ALLOW" : "BLOCK",
    allowed,
    shouldTransition: allowed,
    passedGates: context.passedGates,
    blockedGates: context.blockedGates,
    reasons: context.reasons,
  };
}

function evaluateGeneration(
  generation: GenerationLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!generation) {
    addReason(
      context,
      "GENERATION_EVIDENCE_MISSING",
      "generation",
      "A persisted Generator V3 run is required."
    );
    return;
  }

  if (generation.contractVersion !== GENERATION_RESULT_CONTRACT_VERSION) {
    addReason(
      context,
      "GENERATION_CONTRACT_INVALID",
      "generation",
      `Generation evidence must use ${GENERATION_RESULT_CONTRACT_VERSION}.`
    );
  }

  if (!generation.terminalState) {
    addReason(
      context,
      "GENERATION_STATE_MISSING",
      "generation",
      "Generation has no persisted terminal state."
    );
  } else if (
    generation.terminalState !== "READY_FOR_PREVIEW" &&
    generation.terminalState !== "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW"
  ) {
    addReason(
      context,
      "GENERATION_STATE_NOT_LAUNCHABLE",
      "generation",
      `Generation state '${generation.terminalState}' is not launchable.`
    );
  }

  if (generation.productClassProfileSource === "RUNTIME_PROVISIONAL") {
    addReason(
      context,
      "GENERATION_PRODUCT_CLASS_PREVIEW_ONLY",
      "generation",
      "Runtime-provisional product classes are approved for internal preview only and cannot authorize a LIVE transition."
    );
  }

  const provenance = [
    generation.runId,
    generation.generatorVersion,
    generation.ontologyVersion,
    generation.evaluatorVersion,
  ];
  if (provenance.some((value) => !isNonEmpty(value))) {
    addReason(
      context,
      "GENERATION_PROVENANCE_MISSING",
      "generation",
      "Generation run, generator, ontology, and evaluator versions must all be recorded."
    );
  }

  if (!isIsoDate(generation.completedAt)) {
    addReason(
      context,
      "GENERATION_COMPLETION_INVALID",
      "generation",
      "Generation completion timestamp is missing or invalid."
    );
  }
}

function evaluateManualReview(
  generation: GenerationLaunchEvidenceV3 | null,
  review: ManualReviewEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!review) {
    addReason(
      context,
      "MANUAL_REVIEW_EVIDENCE_MISSING",
      "manual-review",
      "Policy/manual-review evidence is missing."
    );
    return;
  }

  const generationRequiresReview =
    generation?.terminalState === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW";

  if (review.required === null || (generationRequiresReview && review.required !== true)) {
    addReason(
      context,
      "MANUAL_REVIEW_REQUIRED",
      "manual-review",
      "The generation policy requires an explicit completed manual review."
    );
  }

  if (review.required === true || generationRequiresReview) {
    if (review.status === "REJECTED") {
      addReason(
        context,
        "MANUAL_REVIEW_REJECTED",
        "manual-review",
        "Manual policy review rejected live launch."
      );
    } else if (review.status !== "APPROVED") {
      addReason(
        context,
        "MANUAL_REVIEW_PENDING",
        "manual-review",
        "Required manual policy review is not approved."
      );
    }

    if (!isNonEmpty(review.reviewedBy) || !isIsoDate(review.reviewedAt)) {
      addReason(
        context,
        "MANUAL_REVIEW_METADATA_INVALID",
        "manual-review",
        "Approved manual review must record reviewer and timestamp."
      );
    }
  } else if (review.required === false && review.status !== "NOT_REQUIRED") {
    addReason(
      context,
      "MANUAL_REVIEW_PENDING",
      "manual-review",
      "Manual-review status is inconsistent with a NOT_REQUIRED policy decision."
    );
  }
}

function evaluateHumanApproval(
  approval: HumanLaunchApprovalV3 | null,
  context: EvaluationContext
): void {
  if (!approval) {
    addReason(
      context,
      "HUMAN_APPROVAL_MISSING",
      "human-approval",
      "An explicit human launch approval is required."
    );
    return;
  }

  if (approval.approved !== true) {
    addReason(
      context,
      "HUMAN_APPROVAL_NOT_GRANTED",
      "human-approval",
      "Human launch approval has not been granted."
    );
  }
  if (approval.approvalKind !== "HUMAN") {
    addReason(
      context,
      "HUMAN_APPROVAL_NOT_HUMAN",
      "human-approval",
      "Automated or inferred approval cannot authorize go-live."
    );
  }
  if (!isNonEmpty(approval.approvedBy) || !isIsoDate(approval.approvedAt)) {
    addReason(
      context,
      "HUMAN_APPROVAL_METADATA_INVALID",
      "human-approval",
      "Human approval must record approver and timestamp."
    );
  }
}

function evaluateCatalog(
  catalog: CatalogLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(catalog, "catalog", "CATALOG", context)) return;

  const minimum = catalog!.minimumProductCount;
  const visible = catalog!.previewVisibleProductCount;
  if (minimum === null || visible === null) {
    addReason(
      context,
      "CATALOG_COUNTS_UNKNOWN",
      "catalog",
      "Catalog minimum and preview-visible product count must be known."
    );
  } else if (!isPositiveInteger(minimum) || !isNonNegativeInteger(visible)) {
    addReason(
      context,
      "CATALOG_COUNTS_INVALID",
      "catalog",
      "Catalog counts must be valid integers and the minimum must be positive."
    );
  } else if (visible < minimum) {
    addReason(
      context,
      "CATALOG_MINIMUM_NOT_MET",
      "catalog",
      `Preview has ${visible} eligible products; at least ${minimum} are required.`
    );
  }

  if (catalog!.previewComplete !== true) {
    addReason(
      context,
      "PREVIEW_CATALOG_INCOMPLETE",
      "catalog",
      "Preview catalog is incomplete or has not been verified complete."
    );
  }
}

function evaluateRelevance(
  relevance: RelevanceLaunchEvidenceV3 | null,
  catalog: CatalogLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(relevance, "relevance", "RELEVANCE", context)) return;

  const evaluated = relevance!.evaluatedVisibleProductCount;
  const failed = relevance!.failedVisibleProductCount;
  const unknown = relevance!.unknownVisibleProductCount;
  if (evaluated === null || failed === null || unknown === null) {
    addReason(
      context,
      "RELEVANCE_COUNTS_UNKNOWN",
      "relevance",
      "Visible-product relevance counts must be known."
    );
    return;
  }
  if (
    !isNonNegativeInteger(evaluated) ||
    !isNonNegativeInteger(failed) ||
    !isNonNegativeInteger(unknown)
  ) {
    addReason(
      context,
      "RELEVANCE_COUNTS_INVALID",
      "relevance",
      "Visible-product relevance counts must be non-negative integers."
    );
    return;
  }
  if (failed > 0) {
    addReason(
      context,
      "RELEVANCE_FAILED_VISIBLE_PRODUCTS",
      "relevance",
      `${failed} preview-visible products failed the relevance gate.`
    );
  }
  if (unknown > 0) {
    addReason(
      context,
      "RELEVANCE_UNKNOWN_VISIBLE_PRODUCTS",
      "relevance",
      `${unknown} preview-visible products have unknown relevance.`
    );
  }

  const visible = catalog?.previewVisibleProductCount;
  if (isNonNegativeInteger(visible) && evaluated < visible) {
    addReason(
      context,
      "RELEVANCE_COVERAGE_INCOMPLETE",
      "relevance",
      `Only ${evaluated} of ${visible} preview-visible products have relevance evidence.`
    );
  }
}

function evaluateMedia(
  media: MediaLaunchEvidenceV3 | null,
  catalog: CatalogLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(media, "media", "MEDIA", context)) return;

  const usable = media!.usableVisibleProductCount;
  const failed = media!.failedVisibleProductCount;
  const unknown = media!.unknownVisibleProductCount;
  if (usable === null || failed === null || unknown === null) {
    addReason(
      context,
      "MEDIA_COUNTS_UNKNOWN",
      "media",
      "Visible-product media counts must be known."
    );
    return;
  }
  if (
    !isNonNegativeInteger(usable) ||
    !isNonNegativeInteger(failed) ||
    !isNonNegativeInteger(unknown)
  ) {
    addReason(
      context,
      "MEDIA_COUNTS_INVALID",
      "media",
      "Visible-product media counts must be non-negative integers."
    );
    return;
  }
  if (failed > 0) {
    addReason(
      context,
      "MEDIA_FAILED_VISIBLE_PRODUCTS",
      "media",
      `${failed} preview-visible products have failed media.`
    );
  }
  if (unknown > 0) {
    addReason(
      context,
      "MEDIA_UNKNOWN_VISIBLE_PRODUCTS",
      "media",
      `${unknown} preview-visible products have unknown media readiness.`
    );
  }

  const visible = catalog?.previewVisibleProductCount;
  if (isNonNegativeInteger(visible) && usable < visible) {
    addReason(
      context,
      "MEDIA_COVERAGE_INCOMPLETE",
      "media",
      `Only ${usable} of ${visible} preview-visible products have usable stored media.`
    );
  }
}

function evaluateContent(
  content: ContentLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(content, "content", "CONTENT", context)) return;
  if (content!.grounded !== true) {
    addReason(
      context,
      "CONTENT_NOT_GROUNDED",
      "content",
      "Storefront content is not verified as grounded in product/supplier facts."
    );
  }
  if (content!.unverifiedClaimsPresent !== false) {
    addReason(
      context,
      "CONTENT_UNVERIFIED_CLAIMS",
      "content",
      "Unverified claims are present or have not been ruled out."
    );
  }
}

function evaluateCompliance(
  compliance: ComplianceLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(compliance, "compliance", "COMPLIANCE", context)) return;
  if (compliance!.policyPagesPresent !== true) {
    addReason(
      context,
      "COMPLIANCE_POLICY_PAGES_MISSING",
      "compliance",
      "Required policy pages are missing or unverified."
    );
  }
  if (compliance!.requiredDisclosuresPresent !== true) {
    addReason(
      context,
      "COMPLIANCE_DISCLOSURES_MISSING",
      "compliance",
      "Required commerce and dropship disclosures are missing or unverified."
    );
  }
  const flags = compliance!.unresolvedFlagCount;
  if (!isNonNegativeInteger(flags)) {
    addReason(
      context,
      "COMPLIANCE_FLAG_COUNT_INVALID",
      "compliance",
      "Compliance flag count is missing or invalid."
    );
  } else if (flags > 0) {
    addReason(
      context,
      "COMPLIANCE_FLAGS_UNRESOLVED",
      "compliance",
      `${flags} compliance flags remain unresolved.`
    );
  }
}

function evaluateDomain(
  domain: DomainLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(domain, "domain", "DOMAIN", context)) return;
  if (!isPublicHostname(domain!.hostname)) {
    addReason(
      context,
      "DOMAIN_HOSTNAME_INVALID",
      "domain",
      "A valid public hostname without protocol, path, localhost, or test suffix is required."
    );
  }
  if (domain!.ownershipVerified !== true) {
    addReason(
      context,
      "DOMAIN_OWNERSHIP_UNVERIFIED",
      "domain",
      "Domain ownership has not been verified."
    );
  }
  if (domain!.dnsReady !== true) {
    addReason(context, "DOMAIN_DNS_NOT_READY", "domain", "Domain DNS is not ready.");
  }
  if (domain!.tlsReady !== true) {
    addReason(context, "DOMAIN_TLS_NOT_READY", "domain", "Domain TLS is not ready.");
  }
  if (domain!.canonicalConfigured !== true) {
    addReason(
      context,
      "DOMAIN_CANONICAL_NOT_CONFIGURED",
      "domain",
      "Canonical domain routing is not configured."
    );
  }
}

function evaluateCommerce(
  commerce: CommerceLaunchEvidenceV3 | null,
  context: EvaluationContext
): void {
  if (!evaluateVerifiedEvidence(commerce, "commerce", "COMMERCE", context)) return;

  const checks: Array<{
    ready: boolean | null;
    code: GoLiveBlockReasonCodeV3;
    message: string;
  }> = [
    {
      ready: commerce!.checkoutReady,
      code: "COMMERCE_CHECKOUT_NOT_READY",
      message: "Checkout is not verified ready.",
    },
    {
      ready: commerce!.paymentReady,
      code: "COMMERCE_PAYMENT_NOT_READY",
      message: "Payment processing is not verified ready.",
    },
    {
      ready: commerce!.orderRoutingReady,
      code: "COMMERCE_ORDER_ROUTING_NOT_READY",
      message: "Order routing is not verified ready.",
    },
    {
      ready: commerce!.fulfillmentReady,
      code: "COMMERCE_FULFILLMENT_NOT_READY",
      message: "Fulfillment is not verified ready.",
    },
    {
      ready: commerce!.shippingReady,
      code: "COMMERCE_SHIPPING_NOT_READY",
      message: "Shipping configuration is not verified ready.",
    },
    {
      ready: commerce!.returnsReady,
      code: "COMMERCE_RETURNS_NOT_READY",
      message: "Returns handling is not verified ready.",
    },
    {
      ready: commerce!.taxDecisionRecorded,
      code: "COMMERCE_TAX_DECISION_MISSING",
      message: "Tax handling decision is missing or unverified.",
    },
  ];

  for (const check of checks) {
    if (check.ready !== true) addReason(context, check.code, "commerce", check.message);
  }
}

function evaluateVerifiedEvidence(
  evidence: VerifiedLaunchEvidenceV3 | null,
  gate: GoLiveGateIdV3,
  prefix: EvidencePrefix,
  context: EvaluationContext
): boolean {
  if (!evidence) {
    addReason(
      context,
      `${prefix}_EVIDENCE_MISSING` as GoLiveBlockReasonCodeV3,
      gate,
      `${titleCase(gate)} readiness evidence is missing.`
    );
    return false;
  }

  if (evidence.status !== "PASS") {
    const suffix =
      evidence.status === "FAIL"
        ? "FAILED"
        : evidence.status === "REVIEW"
          ? "REVIEW_REQUIRED"
          : "UNKNOWN";
    addReason(
      context,
      `${prefix}_${suffix}` as GoLiveBlockReasonCodeV3,
      gate,
      `${titleCase(gate)} readiness is ${
        evidence.status === "FAIL"
          ? "failed"
          : evidence.status === "REVIEW"
            ? "still under review"
            : "unknown"
      }.`
    );
    return false;
  }

  const refs = Array.isArray(evidence.evidenceRefs)
    ? evidence.evidenceRefs.filter(isNonEmpty)
    : [];
  if (refs.length === 0 || !isNonEmpty(evidence.verifiedBy) || !isIsoDate(evidence.verifiedAt)) {
    addReason(
      context,
      `${prefix}_PASS_UNVERIFIED` as GoLiveBlockReasonCodeV3,
      gate,
      `${titleCase(gate)} PASS lacks evidence references, verifier, or timestamp.`
    );
    return false;
  }

  return true;
}

function evaluateGate(
  context: EvaluationContext,
  gate: GoLiveGateIdV3,
  evaluate: () => void
): void {
  const before = context.reasons.length;
  evaluate();
  if (context.reasons.length === before) context.passedGates.push(gate);
  else context.blockedGates.push(gate);
}

function addReason(
  context: EvaluationContext,
  code: GoLiveBlockReasonCodeV3,
  gate: GoLiveGateIdV3,
  message: string
): void {
  context.reasons.push({ code, gate, message });
}

function blockedDecision(reasons: GoLiveGateReasonV3[]): GoLiveGateDecisionV3 {
  return {
    gateVersion: GO_LIVE_GATE_VERSION,
    decision: "BLOCK",
    allowed: false,
    shouldTransition: false,
    passedGates: [],
    blockedGates: [...new Set(reasons.map((reason) => reason.gate))],
    reasons,
  };
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  if (!isNonEmpty(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isPublicHostname(value: unknown): value is string {
  if (!isNonEmpty(value)) return false;
  const hostname = value.trim().toLowerCase();
  if (
    hostname.includes("://") ||
    hostname.includes("/") ||
    hostname.includes(":") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid")
  ) {
    return false;
  }
  if (hostname.length > 253 || !hostname.includes(".")) return false;
  const labels = hostname.split(".");
  return labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("-", " ");
}
