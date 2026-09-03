import type {
  BuildPhaseV1,
  BuildTerminalStateV1,
  PreviewRevisionPointerV1,
  RevisionStatusV1,
  StoreBuildEventTypeV1,
  StoreBuildEventV1,
  StoreBuildRunV2,
  StoreRevisionDocumentV2,
  StoreRevisionV2,
} from "./contracts";

export interface ClaimBuildRunV2Result {
  created: boolean;
  run: StoreBuildRunV2;
}

export interface FinalizeBuildRevisionV2Input {
  id: string;
  buildRunId: string;
  storeId: string;
  inputDigest: string;
  outputDigest: string;
  catalogArtifactId: string;
  catalogBindingJson: string;
  parentRevisionId: string | null;
  parentRevisionOutputDigest: string | null;
  document: StoreRevisionDocumentV2;
  createdAt: string;
  completedAt: string;
}

export interface FinalizeBuildRevisionV2Result {
  run: StoreBuildRunV2;
  revision: StoreRevisionV2;
}

export interface FailBuildRunV1Input {
  storeId: string;
  runId: string;
  terminalState: Exclude<BuildTerminalStateV1, "SUCCEEDED">;
  completedAt: string;
  failureCode: string;
  failureMessage: string;
}

export interface ReviewRevisionV2Input {
  storeId: string;
  revisionId: string;
  expectedStatus: "DRAFT";
  expectedOutputDigest: string;
  nextStatus: Exclude<RevisionStatusV1, "DRAFT">;
  reviewedBy: string;
  reason: string;
  reviewedAt: string;
}

/** @deprecated V2.1 writes use the explicit V2 repository contracts. */
export type ClaimBuildRunV1Result = ClaimBuildRunV2Result;
/** @deprecated V2.1 writes use the explicit V2 repository contracts. */
export type FinalizeBuildRevisionV1Input = FinalizeBuildRevisionV2Input;
/** @deprecated V2.1 writes use the explicit V2 repository contracts. */
export type FinalizeBuildRevisionV1Result = FinalizeBuildRevisionV2Result;
/** @deprecated V2.1 writes use the explicit V2 repository contracts. */
export type ReviewRevisionV1Input = ReviewRevisionV2Input;

export interface CompareAndSwapPreviewV1Input {
  storeId: string;
  targetRevisionId: string;
  expectedVersion: number;
  action: "PROMOTE" | "ROLLBACK";
  changedBy: string;
  reason: string;
  changedAt: string;
}

/**
 * Persistence boundary for the Store Factory V2 core.
 *
 * Each mutating method is one logical atomic operation. Implementations must
 * enforce request-key uniqueness, append-only event sequence allocation, and
 * compare-and-swap semantics rather than relying on prior service reads.
 */
export interface StoreFactoryV2Repository {
  claimBuildRun(run: StoreBuildRunV2): Promise<ClaimBuildRunV2Result>;
  findBuildRunByRequestKey(
    storeId: string,
    requestKey: string
  ): Promise<StoreBuildRunV2 | null>;
  getBuildRun(runId: string): Promise<StoreBuildRunV2 | null>;
  advanceBuildPhase(input: {
    storeId: string;
    runId: string;
    expectedPhase: BuildPhaseV1;
    nextPhase: BuildPhaseV1;
    at: string;
  }): Promise<StoreBuildRunV2>;
  /**
   * Atomically inserts the immutable revision, appends REVISION_CREATED,
   * settles the run as SUCCEEDED, and appends RUN_SUCCEEDED.
   */
  finalizeBuildRevision(
    input: FinalizeBuildRevisionV2Input
  ): Promise<FinalizeBuildRevisionV2Result>;
  /** May settle only a run that still owns no revision. */
  failBuildRun(input: FailBuildRunV1Input): Promise<StoreBuildRunV2>;
  getRevision(revisionId: string): Promise<StoreRevisionV2 | null>;
  reviewRevision(input: ReviewRevisionV2Input): Promise<StoreRevisionV2>;
  getPreviewPointer(storeId: string): Promise<PreviewRevisionPointerV1>;
  compareAndSwapPreviewPointer(
    input: CompareAndSwapPreviewV1Input
  ): Promise<PreviewRevisionPointerV1 | null>;
  listBuildEvents(buildRunId: string): Promise<StoreBuildEventV1[]>;
  listStoreBuildEvents(storeId: string): Promise<StoreBuildEventV1[]>;
}

export interface AppendEventV1Input {
  buildRunId: string;
  phase: BuildPhaseV1;
  type: StoreBuildEventTypeV1;
  payload?: Readonly<Record<string, unknown>>;
  createdAt: string;
}
