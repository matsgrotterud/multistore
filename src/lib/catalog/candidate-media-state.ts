export const CANDIDATE_MEDIA_STAGING_STATUS = "ENRICHING" as const;

export interface CandidateMediaIngestionCounts {
  stored: number;
  failed: number;
  skipped: number;
}

export interface CandidateMediaStateCasResult {
  applied: boolean;
  actualStatus: string | null;
}

export interface CandidateMediaRequirementOutcome {
  mediaReady: boolean;
  usablePersistedImages: number;
  ingestion: CandidateMediaIngestionCounts;
  diagnostics: string[];
  targetStatus: "ENRICHED" | "REJECTED";
  transitionApplied: boolean;
  finalStatus: string | null;
  rejectionReason?: string;
}

interface EnforceCandidateMediaRequirementInput {
  ingest: () => Promise<CandidateMediaIngestionCounts>;
  countUsablePersistedImages: () => Promise<number>;
  transitionCandidate: (input: {
    targetStatus: "ENRICHED" | "REJECTED";
    rejectionReason?: string;
  }) => Promise<CandidateMediaStateCasResult>;
}

export interface StoredCandidateMediaEvidence {
  mediaType: string;
  ingestionStatus: string;
  storageUrl: string | null;
  contentType: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

const EMPTY_COUNTS: CandidateMediaIngestionCounts = {
  stored: 0,
  failed: 0,
  skipped: 0,
};

/** A quality pass is staged and remains non-approvable until media proof. */
export function stageCandidateEvaluationStatus(
  evaluatedStatus: "ENRICHED" | "REJECTED"
): typeof CANDIDATE_MEDIA_STAGING_STATUS | "REJECTED" {
  return evaluatedStatus === "ENRICHED"
    ? CANDIDATE_MEDIA_STAGING_STATUS
    : "REJECTED";
}

export function candidateSummaryDelta(status: string | null): {
  enriched: number;
  rejected: number;
} {
  return {
    enriched: status === "ENRICHED" ? 1 : 0,
    rejected: status === "REJECTED" ? 1 : 0,
  };
}

export function isCandidateReadyForApproval(status: string): boolean {
  return status === "ENRICHED";
}

export function assertCandidateApprovalCasResult(
  candidateId: string,
  updatedCount: number,
  actualStatus: string | null
): void {
  if (updatedCount === 1 || actualStatus === "APPROVED") return;
  throw new Error(
    `Candidate ${candidateId} cannot be approved from ${actualStatus ?? "MISSING"}.`
  );
}

/**
 * Select only durable media whose stored type agrees with the fetched MIME.
 * Legacy/spoofed rows cannot cross the final import boundary.
 */
export function selectVerifiedStoredCandidateMedia<
  T extends StoredCandidateMediaEvidence,
>(assets: T[], isUrlUsable: (url: string | null) => boolean): T[] {
  return assets.filter(
    (asset) =>
      asset.ingestionStatus === "STORED" &&
      verifiedMediaTypeForContentType(asset.contentType) === asset.mediaType &&
      isUrlUsable(asset.storageUrl)
  );
}

/** Only verified images count toward enrichment/import readiness. */
export function selectVerifiedStoredCandidateImages<
  T extends StoredCandidateMediaEvidence,
>(assets: T[], isUrlUsable: (url: string | null) => boolean): T[] {
  return selectVerifiedStoredCandidateMedia(assets, isUrlUsable)
    .filter((asset) => asset.mediaType === "IMAGE")
    .sort((left, right) => {
      if (Boolean(left.isPrimary) !== Boolean(right.isPrimary)) {
        return left.isPrimary ? -1 : 1;
      }
      return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    });
}

export function requireVerifiedStoredPrimaryImage<
  T extends StoredCandidateMediaEvidence,
>(candidateId: string, images: T[]): T & { storageUrl: string } {
  const primary = images[0];
  if (!primary?.storageUrl) {
    throw new Error(
      `Candidate ${candidateId} requires at least one usable verified STORED IMAGE before import.`
    );
  }
  return primary as T & { storageUrl: string };
}

/**
 * Fail-closed transition for required candidate images. A quality-passing
 * candidate starts in ENRICHING. Only a successful CAS after durable image
 * verification may promote it to ENRICHED; otherwise the CAS targets REJECTED.
 */
export async function enforceCandidateMediaRequirement(
  input: EnforceCandidateMediaRequirementInput
): Promise<CandidateMediaRequirementOutcome> {
  let ingestion = EMPTY_COUNTS;
  const diagnostics: string[] = [];

  try {
    ingestion = await input.ingest();
    if (ingestion.failed > 0) {
      diagnostics.push(`MEDIA_ITEMS_FAILED=${ingestion.failed}`);
    }
  } catch (error) {
    diagnostics.push(`MEDIA_INGESTION_ERROR=${boundedDiagnostic(error)}`);
  }

  let usablePersistedImages = 0;
  try {
    usablePersistedImages = Math.max(
      0,
      await input.countUsablePersistedImages()
    );
  } catch (error) {
    diagnostics.push(`MEDIA_VERIFICATION_ERROR=${boundedDiagnostic(error)}`);
  }

  const mediaReady = usablePersistedImages > 0;
  const targetStatus = mediaReady ? "ENRICHED" : "REJECTED";
  const counts = `stored=${ingestion.stored},failed=${ingestion.failed},skipped=${ingestion.skipped}`;
  const rejectionReason = mediaReady
    ? undefined
    : [
        "Media: MEDIA_STORED_USABLE_IMAGE_MISSING",
        counts,
        ...diagnostics,
      ].join("; ");
  const transition = await input.transitionCandidate({
    targetStatus,
    rejectionReason,
  });
  const finalStatus = transition.applied
    ? targetStatus
    : transition.actualStatus;

  if (!transition.applied) {
    diagnostics.push(
      `MEDIA_STATE_CONTENTION=expected_${CANDIDATE_MEDIA_STAGING_STATUS},target_${targetStatus},actual_${
        transition.actualStatus ?? "MISSING"
      }`
    );
  }

  return {
    mediaReady,
    usablePersistedImages,
    ingestion,
    diagnostics,
    targetStatus,
    transitionApplied: transition.applied,
    finalStatus,
    rejectionReason,
  };
}

function verifiedMediaTypeForContentType(
  value: string | null
): "IMAGE" | "VIDEO" | null {
  const normalized = (value ?? "").split(";")[0].trim().toLowerCase();
  if (["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(normalized)) {
    return "IMAGE";
  }
  if (["video/mp4", "video/webm"].includes(normalized)) return "VIDEO";
  return null;
}

function boundedDiagnostic(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").trim().slice(0, 300) || "unknown error";
}
