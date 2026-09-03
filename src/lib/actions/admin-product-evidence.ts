import { checkContent } from "@/lib/ai/content-guardrails";
import {
  evaluateCandidateV1,
  parseNicheIntentV1,
  resolveNicheIntentV1,
  type CandidateEvaluationV1,
  type NicheIntentV1,
} from "@/lib/generator-v3";
import type { SpecItem } from "@/lib/types";
import { parseJsonObject } from "@/lib/utils/json";

export const ADMIN_PRODUCT_EDIT_EVIDENCE_VERSION =
  "admin-product-edit-evidence.v1" as const;

interface AdminProductEditStore {
  niche: string;
  launchStatus: string;
}

export interface AdminProductEditCandidate {
  title: string;
  description: string;
  specs: SpecItem[];
  visibleContentText: string;
  providerKey: string | null;
  externalId: string | null;
  sourceUrl: string | null;
  usableStoredMediaCount: number;
  variantIdentityReady: boolean;
  price: number;
  marginPercent: number;
  shippingDaysMax: number;
  riskVeto: boolean;
}

export interface AdminProductEditEvidenceInput {
  store: AdminProductEditStore;
  candidate: AdminProductEditCandidate;
  supplierDataJson: string;
  requestedPublished: boolean;
}

export interface AdminProductEditEvidenceResult {
  evaluation: CandidateEvaluationV1;
  saveAllowed: boolean;
  publicationAllowed: boolean;
  publicationReasonCodes: string[];
  nextSupplierData: Record<string, unknown>;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function contentFactScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function providerCategoryPath(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function persistedIntent(value: unknown): NicheIntentV1 | null {
  return parseNicheIntentV1(value);
}

/**
 * Re-evaluate the exact post-edit candidate before it is persisted.
 *
 * The previous candidateEvaluationV1 is deliberately never consulted. Other
 * supplier provenance is retained, while the stale evaluation and content
 * guardrail flags are replaced with evidence computed from the proposed edit.
 */
export function evaluateAdminProductEditEvidence(
  input: AdminProductEditEvidenceInput
): AdminProductEditEvidenceResult {
  const previousSupplierData = parseJsonObject(input.supplierDataJson);
  const contentReport = checkContent({
    text: input.candidate.visibleContentText,
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });
  const groundedContentReady =
    contentFactScore(previousSupplierData.contentFactScore) >= 1 &&
    contentReport.passed;

  const evaluation = evaluateCandidateV1(
    persistedIntent(previousSupplierData.nicheIntentV1) ??
      resolveNicheIntentV1({ niche: input.store.niche }),
    {
      title: input.candidate.title,
      description: input.candidate.description,
      providerCategoryPath: providerCategoryPath(
        previousSupplierData.providerCategoryPath
      ),
      specs: input.candidate.specs,
      providerKey: input.candidate.providerKey,
      externalId: input.candidate.externalId,
      sourceUrl: input.candidate.sourceUrl,
      usableStoredMediaCount: input.candidate.usableStoredMediaCount,
      variantIdentityReady: input.candidate.variantIdentityReady,
      price: input.candidate.price,
      marginPercent: input.candidate.marginPercent,
      shippingDaysMax: input.candidate.shippingDaysMax,
      riskVeto: input.candidate.riskVeto,
      groundedContentReady,
    }
  );

  const reasons: string[] = [];
  if (input.store.launchStatus === "DRAFT") {
    reasons.push("STORE_DRAFT_PUBLICATION_BLOCKED");
  } else if (
    input.store.launchStatus !== "PREVIEW" &&
    input.store.launchStatus !== "LIVE"
  ) {
    reasons.push("STORE_LAUNCH_STATUS_UNSUPPORTED");
  }

  if (evaluation.relevance.state !== "PASS") {
    reasons.push("RELEVANCE_NOT_PASS", ...evaluation.relevance.reasonCodes);
  }
  if (
    evaluation.policy.state === "FAIL" ||
    evaluation.policy.state === "UNKNOWN"
  ) {
    reasons.push("POLICY_NOT_PREVIEW_SAFE", ...evaluation.policy.reasonCodes);
  }
  if (!groundedContentReady) {
    reasons.push("GROUNDED_CONTENT_NOT_READY");
  }
  if (evaluation.previewVisibility.state !== "PASS") {
    reasons.push(
      "PREVIEW_VISIBILITY_NOT_PASS",
      ...evaluation.supplierEvidence.reasonCodes,
      ...evaluation.mediaReadiness.reasonCodes,
      ...evaluation.riskIp.reasonCodes,
      ...evaluation.previewVisibility.reasonCodes
    );
  }

  if (input.store.launchStatus === "LIVE") {
    if (evaluation.policy.state !== "PASS") {
      reasons.push("POLICY_NOT_LIVE_APPROVED", ...evaluation.policy.reasonCodes);
    }
    if (evaluation.liveCommerceEligibility.state !== "PASS") {
      reasons.push(
        "LIVE_COMMERCE_NOT_PASS",
        ...evaluation.variantReadiness.reasonCodes,
        ...evaluation.priceMargin.reasonCodes,
        ...evaluation.shipping.reasonCodes,
        ...evaluation.liveCommerceEligibility.reasonCodes
      );
    }
  }

  const publicationReasonCodes = unique(reasons);
  const publicationAllowed = publicationReasonCodes.length === 0;
  const saveAllowed = !input.requestedPublished || publicationAllowed;

  const guardrailFlags = contentReport.flags.map(
    (flag) => `${flag.severity}:${flag.rule}`
  );
  const nextSupplierData = {
    ...previousSupplierData,
    candidateEvaluationV1: evaluation,
    guardrailFlags,
    adminProductEditEvidenceV1: {
      version: ADMIN_PRODUCT_EDIT_EVIDENCE_VERSION,
      evaluatedAt: evaluation.evaluatedAt,
      groundedContentReady,
      requestedPublished: input.requestedPublished,
      saveAllowed,
      publicationAllowed,
      publicationReasonCodes,
    },
  };

  return {
    evaluation,
    saveAllowed,
    publicationAllowed,
    publicationReasonCodes,
    nextSupplierData,
  };
}
