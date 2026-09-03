import type { StoreSettings } from "@/lib/settings/store-settings";

type GenerationSettings = StoreSettings["generation"];

const RELEVANCE_STATES = new Set(["PASS", "FAIL", "UNKNOWN", "REVIEW"]);

export interface CandidateRelevanceSummary {
  state: "PASS" | "FAIL" | "UNKNOWN" | "REVIEW";
  explanation: string;
  reasonCodes: string[];
  evidence: Array<{ field: string; value: string }>;
  evaluatorVersion: string | null;
  productClass: string | null;
}

/**
 * ProductCandidate.signalsJson predates V3 and is deliberately schemaless.
 * Parse only the small, display-safe subset the admin table needs so a stale
 * or malformed supplier row can never break the entire import screen.
 */
export function parseCandidateRelevanceSummary(
  signalsJson: string
): CandidateRelevanceSummary | null {
  try {
    const signals = asRecord(JSON.parse(signalsJson));
    if (!signals) return null;
    const evaluation = asRecord(signals.candidateEvaluationV1);
    const relevance = asRecord(evaluation?.relevance);
    if (!relevance) return null;
    const state = relevance?.state;

    if (typeof state !== "string" || !RELEVANCE_STATES.has(state)) return null;

    const reasonCodes = Array.isArray(relevance.reasonCodes)
      ? relevance.reasonCodes.filter((value): value is string => typeof value === "string")
      : [];
    const evidence = Array.isArray(relevance.evidence)
      ? relevance.evidence.flatMap((item) => {
          const record = asRecord(item);
          if (!record || typeof record.field !== "string" || typeof record.value !== "string") {
            return [];
          }
          return [{ field: record.field, value: record.value }];
        })
      : [];

    return {
      state: state as CandidateRelevanceSummary["state"],
      explanation:
        typeof relevance.explanation === "string" ? relevance.explanation : "No explanation recorded.",
      reasonCodes,
      evidence,
      evaluatorVersion: typeof evaluation?.version === "string" ? evaluation.version : null,
      productClass:
        typeof evaluation?.productClass === "string" ? evaluation.productClass : null,
    };
  } catch {
    return null;
  }
}

export interface AdminLiveBlocker {
  code: string;
  message: string;
}

/**
 * These are the blockers visible from the persisted generation snapshot. The
 * server-side go-live gate remains authoritative and may report additional
 * DNS, commerce or compliance evidence gaps.
 */
export function getGenerationLiveBlockers(input: {
  generation: GenerationSettings;
  launchStatus: string;
  plannedDomain: string | null;
}): AdminLiveBlocker[] {
  if (input.launchStatus === "LIVE") return [];

  const generation = input.generation;
  const blockers: AdminLiveBlocker[] = [];

  if (!generation) {
    blockers.push({
      code: "GENERATION_EVIDENCE_MISSING",
      message: "No Generator V3 audit snapshot is attached to this store.",
    });
  } else {
    if (
      generation.status !== "READY_FOR_PREVIEW" &&
      generation.status !== "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW"
    ) {
      blockers.push({
        code: "GENERATION_STATE_NOT_LAUNCHABLE",
        message: `Generation ended in ${generation.status}.`,
      });
    }

    if (!generation.liveCommerceAllowed) {
      blockers.push({
        code: "LIVE_COMMERCE_NOT_ALLOWED",
        message: "The resolved product-class policy does not allow live commerce.",
      });
    }

    if (generation.manualReviewRequired && generation.manualReviewStatus !== "APPROVED") {
      blockers.push({
        code: "MANUAL_REVIEW_NOT_APPROVED",
        message: `Manual review is ${generation.manualReviewStatus.toLowerCase().replaceAll("_", " ")}.`,
      });
    }

    if (!generation.humanLaunchApproved) {
      blockers.push({
        code: "HUMAN_LAUNCH_APPROVAL_MISSING",
        message: "A named human has not approved the live transition.",
      });
    }

    if (generation.previewVisibleProducts < generation.minimumProducts) {
      blockers.push({
        code: "MINIMUM_PREVIEW_CATALOG_NOT_MET",
        message: `${generation.previewVisibleProducts} of ${generation.minimumProducts} required products are preview-visible.`,
      });
    }
  }

  if (!input.plannedDomain) {
    blockers.push({
      code: "PLANNED_DOMAIN_MISSING",
      message: "No planned production domain is recorded.",
    });
  }

  return blockers;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
