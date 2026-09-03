import { z } from "zod";
import { parseCatalogAlignmentV1, type CatalogAlignmentV1 } from "@/lib/catalog/catalog-alignment";
import {
  CATALOG_REFRESH_PROPOSAL_VERSION,
  catalogRefreshChangeV1Schema,
  catalogRefreshDecisionSchema,
  parseSupplierProductSnapshotV1,
  type CatalogRefreshChangeV1,
  type CatalogRefreshDecision,
  type SupplierProductSnapshotV1,
} from "@/lib/catalog/catalog-refresh-proposal";

const reasonCodesSchema = z.array(z.string().min(1));
const changesSchema = z.array(catalogRefreshChangeV1Schema);
const sourceStatusSchema = z.enum(["AVAILABLE", "SOURCE_UNAVAILABLE"]);
const workflowStatusSchema = z.enum([
  "RECORDED",
  "OPEN",
  "NEEDS_REVIEW",
  "SOURCE_UNAVAILABLE",
  "APPLIED",
  "DISMISSED",
]);
const fingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const historyCursorSchema = z
  .object({
    observedAt: z.string().datetime({ offset: true }),
    id: z.string().min(1).max(160),
  })
  .strict();

export interface CatalogHistoryCursor {
  observedAt: Date;
  id: string;
}

export interface DurableCatalogEvidenceInput {
  providerKey: string;
  externalId: string;
  sourceStatus: string;
  observedAt: Date;
  snapshotVersion: string | null;
  snapshotFingerprint: string | null;
  snapshotJson: string | null;
  observationReasonCodesJson: string;
  proposal: {
    contractVersion: string;
    proposalFingerprint: string;
    decision: string;
    alignmentStatus: string;
    workflowStatus: string;
    reasonCodesJson: string;
    changesJson: string;
    alignmentJson: string;
  } | null;
}

export interface DurableCatalogEvidence {
  valid: boolean;
  issues: string[];
  sourceStatus: "AVAILABLE" | "SOURCE_UNAVAILABLE" | "INVALID";
  decision: CatalogRefreshDecision | "INVALID";
  workflowStatus: string;
  reasonCodes: string[];
  changes: CatalogRefreshChangeV1[];
  alignment: CatalogAlignmentV1 | null;
  snapshot: SupplierProductSnapshotV1 | null;
}

/**
 * Parses each persisted JSON fragment through the same strict versioned
 * contracts used by the refresh pipeline. A corrupt historical row is
 * represented as invalid evidence instead of crashing the admin page.
 */
export function parseDurableCatalogEvidence(
  input: DurableCatalogEvidenceInput
): DurableCatalogEvidence {
  const issues: string[] = [];
  const sourceStatusResult = sourceStatusSchema.safeParse(input.sourceStatus);
  if (!sourceStatusResult.success) issues.push("source status");
  const snapshot = parseSnapshot(input.snapshotJson, issues);

  if (!input.proposal) {
    return {
      valid: false,
      issues: ["proposal missing", ...issues],
      sourceStatus: sourceStatusResult.success ? sourceStatusResult.data : "INVALID",
      decision: "INVALID",
      workflowStatus: "MISSING",
      reasonCodes: [],
      changes: [],
      alignment: null,
      snapshot,
    };
  }

  const decisionResult = catalogRefreshDecisionSchema.safeParse(input.proposal.decision);
  if (!decisionResult.success) issues.push("decision");
  if (input.proposal.contractVersion !== CATALOG_REFRESH_PROPOSAL_VERSION) {
    issues.push("proposal contract version");
  }
  if (!fingerprintSchema.safeParse(input.proposal.proposalFingerprint).success) {
    issues.push("proposal fingerprint");
  }
  const workflowStatusResult = workflowStatusSchema.safeParse(input.proposal.workflowStatus);
  if (!workflowStatusResult.success) issues.push("workflow status");

  const observationReasons = parseJson(input.observationReasonCodesJson);
  const observationReasonsResult = observationReasons.ok
    ? reasonCodesSchema.safeParse(observationReasons.value)
    : null;
  if (!observationReasonsResult?.success) issues.push("observation reason codes");

  const proposalReasons = parseJson(input.proposal.reasonCodesJson);
  const proposalReasonsResult = proposalReasons.ok
    ? reasonCodesSchema.safeParse(proposalReasons.value)
    : null;
  if (!proposalReasonsResult?.success) issues.push("proposal reason codes");

  const reasonCodes = proposalReasonsResult?.success ? proposalReasonsResult.data : [];
  if (
    observationReasonsResult?.success &&
    proposalReasonsResult?.success &&
    !sameStringArray(observationReasonsResult.data, proposalReasonsResult.data)
  ) {
    issues.push("reason code mismatch");
  }

  const rawChanges = parseJson(input.proposal.changesJson);
  const changesResult = rawChanges.ok ? changesSchema.safeParse(rawChanges.value) : null;
  if (!changesResult?.success) issues.push("changes");

  const rawAlignment = parseJson(input.proposal.alignmentJson);
  const alignment = rawAlignment.ok ? parseCatalogAlignmentV1(rawAlignment.value) : null;
  if (!alignment) issues.push("alignment");
  if (alignment && alignment.status !== input.proposal.alignmentStatus) {
    issues.push("alignment status mismatch");
  }

  if (sourceStatusResult.success) {
    if (sourceStatusResult.data === "AVAILABLE" && !snapshot) {
      issues.push("available observation snapshot missing");
    }
    if (sourceStatusResult.data === "SOURCE_UNAVAILABLE" && snapshot) {
      issues.push("unavailable observation has snapshot");
    }
  }
  if (snapshot) {
    if (input.snapshotVersion !== snapshot.version) issues.push("snapshot version mismatch");
    if (input.snapshotFingerprint !== snapshot.fingerprint) {
      issues.push("snapshot fingerprint mismatch");
    }
  } else if (input.snapshotVersion !== null || input.snapshotFingerprint !== null) {
    issues.push("snapshot metadata without snapshot");
  }
  if (decisionResult.success && changesResult?.success) {
    const changeRequired =
      decisionResult.data === "PROPOSED" || decisionResult.data === "REVIEW_REQUIRED";
    if (changeRequired !== (changesResult.data.length > 0)) {
      issues.push("decision/change mismatch");
    }
  }
  if (decisionResult.success && sourceStatusResult.success) {
    const decisionUnavailable = decisionResult.data === "SOURCE_UNAVAILABLE";
    const sourceUnavailable = sourceStatusResult.data === "SOURCE_UNAVAILABLE";
    if (decisionUnavailable !== sourceUnavailable) issues.push("decision/source mismatch");
  }
  if (snapshot) {
    if (snapshot.identity.providerKey !== input.providerKey) {
      issues.push("snapshot provider mismatch");
    }
    if (snapshot.identity.externalId !== input.externalId) {
      issues.push("snapshot product identity mismatch");
    }
    if (snapshot.observedAt !== input.observedAt.toISOString()) {
      issues.push("snapshot observation time mismatch");
    }
  }

  return {
    valid: issues.length === 0,
    issues: unique(issues),
    sourceStatus: sourceStatusResult.success ? sourceStatusResult.data : "INVALID",
    decision: decisionResult.success ? decisionResult.data : "INVALID",
    workflowStatus: workflowStatusResult.success ? workflowStatusResult.data : "INVALID",
    reasonCodes,
    changes: changesResult?.success ? changesResult.data : [],
    alignment,
    snapshot,
  };
}

export function encodeCatalogHistoryCursor(cursor: CatalogHistoryCursor): string {
  const value = historyCursorSchema.parse({
    observedAt: cursor.observedAt.toISOString(),
    id: cursor.id,
  });
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function parseCatalogHistoryCursor(value: string | undefined): CatalogHistoryCursor | null {
  if (!value || value.length > 512) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const parsed = historyCursorSchema.safeParse(decoded);
    if (!parsed.success) return null;
    const observedAt = new Date(parsed.data.observedAt);
    if (!Number.isFinite(observedAt.getTime())) return null;
    return { observedAt, id: parsed.data.id };
  } catch {
    return null;
  }
}

export function buildCatalogAutopilotHistoryHref(input: {
  store?: string;
  provider?: string;
  decision?: string;
  source?: string;
  cursor?: string;
}): string {
  const params = new URLSearchParams();
  for (const key of ["store", "provider", "decision", "source", "cursor"] as const) {
    const value = input[key]?.trim();
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/admin/catalog-autopilot?${query}` : "/admin/catalog-autopilot";
}

function parseSnapshot(raw: string | null, issues: string[]): SupplierProductSnapshotV1 | null {
  if (raw === null) return null;
  const parsedJson = parseJson(raw);
  if (!parsedJson.ok) {
    issues.push("snapshot JSON");
    return null;
  }
  const snapshot = parseSupplierProductSnapshotV1(parsedJson.value);
  if (!snapshot) issues.push("snapshot contract");
  return snapshot;
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
