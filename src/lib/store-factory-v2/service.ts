import {
  PREVIEW_POINTER_MUTATION_V1,
  REVISION_REVIEW_REQUEST_V2,
  STORE_BUILD_REQUEST_V2,
  STORE_BUILD_RUN_V2,
  STORE_REVISION_CONTRACT_VERSIONS_V2,
  StoreBuildRequestV2Schema,
  StoreRevisionCandidateV1Schema,
  PreviewPointerMutationV1Schema,
  RevisionReviewRequestV2Schema,
  canonicalJsonV1,
  createStoreRevisionDocumentV2,
  deriveStoreBuildRequestKeyV2,
  deterministicStoreFactoryIdV1,
  storeBuildInputDigestV2,
  type PreviewOnlyMutationV1,
  type PreviewPointerMutationV1,
  type PreviewRevisionPointerV1,
  type StoreBuildRequestV2,
  type StoreBuildRunV2,
  type StoreRevisionCandidateV1,
  type StoreRevisionV2,
} from "./contracts";
import { StoreFactoryV2Error } from "./errors";
import { runDeterministicStoreRevisionQaV1 } from "./qa";
import type { StoreFactoryV2Repository } from "./repository";

export interface StoreRevisionAssemblerV2 {
  assemble(input: {
    request: StoreBuildRequestV2;
    inputDigest: string;
  }): unknown | Promise<unknown>;
}

export interface StoreBuildResultV2 {
  replayed: boolean;
  run: StoreBuildRunV2;
  revision: StoreRevisionV2 | null;
}

export interface RevisionReviewResultV1 extends PreviewOnlyMutationV1 {
  revision: StoreRevisionV2;
}

export interface PreviewPointerMutationResultV1 extends PreviewOnlyMutationV1 {
  pointer: PreviewRevisionPointerV1;
}

export interface StoreFactoryV2ServiceDependencies {
  repository: StoreFactoryV2Repository;
  clock?: () => Date;
  assembler: StoreRevisionAssemblerV2;
}

/** @deprecated V2.1 writes use StoreRevisionAssemblerV2. */
export type StoreRevisionAssemblerV1 = StoreRevisionAssemblerV2;
/** @deprecated V2.1 writes use StoreBuildResultV2. */
export type StoreBuildResultV1 = StoreBuildResultV2;

/**
 * Provider-free orchestration for immutable store revisions.
 *
 * This service creates and changes only revision/preview-control records. It
 * has no operation capable of changing Store.launchStatus or asserting LIVE.
 */
export class StoreFactoryV2Service {
  private readonly repository: StoreFactoryV2Repository;
  private readonly clock: () => Date;
  private readonly assembler: StoreRevisionAssemblerV2;

  constructor(dependencies: StoreFactoryV2ServiceDependencies) {
    this.repository = dependencies.repository;
    this.clock = dependencies.clock ?? (() => new Date());
    if (!dependencies.assembler) {
      throw new StoreFactoryV2Error(
        "REVISION_ASSEMBLER_REQUIRED",
        "Store Factory V2 requires an injected revision assembler."
      );
    }
    this.assembler = dependencies.assembler;
  }

  async buildRevision(input: unknown): Promise<StoreBuildResultV2> {
    const request = StoreBuildRequestV2Schema.parse(input);
    if (request.baseRevision) {
      const base = await this.repository.getRevision(
        request.baseRevision.revisionId
      );
      if (
        !base ||
        base.storeId !== request.storeId ||
        base.status !== "APPROVED" ||
        base.outputDigest !== request.baseRevision.outputDigest ||
        base.document.experienceVariant !== "BASELINE" ||
        canonicalJsonV1(base.catalogBinding) !==
          canonicalJsonV1(request.catalogBinding)
      ) {
        throw new StoreFactoryV2Error(
          "BASE_REVISION_INVALID",
          "A refined build requires the active approved baseline with the identical catalog binding."
        );
      }
      const pointer = await this.repository.getPreviewPointer(request.storeId);
      if (pointer.activeRevisionId !== base.id) {
        throw new StoreFactoryV2Error(
          "BASE_REVISION_INVALID",
          "The refined build base is no longer the active preview revision."
        );
      }
    }
    const inputDigest = storeBuildInputDigestV2(request);
    const requestKey = deriveStoreBuildRequestKeyV2(request);
    const runId = deterministicStoreFactoryIdV1(
      "sbr",
      request.storeId,
      requestKey
    );
    const startedAt = this.now();
    const initialRun: StoreBuildRunV2 = {
      contractVersion: STORE_BUILD_RUN_V2,
      id: runId,
      storeId: request.storeId,
      requestKey,
      inputDigest,
      outputDigest: null,
      requestedBy: request.requestedBy,
      requestJson: canonicalJsonV1(request),
      briefJson: canonicalJsonV1(request.brief),
      catalogShapeJson: canonicalJsonV1(request.catalogShape),
      catalogArtifactId: request.catalogBinding.artifactId,
      catalogBindingJson: canonicalJsonV1(request.catalogBinding),
      state: "RUNNING",
      phase: "RECEIVED",
      revisionId: null,
      failureCode: null,
      failureMessage: null,
      startedAt,
      completedAt: null,
    };

    const claim = await this.repository.claimBuildRun(initialRun);
    if (!claim.created) {
      // RUNNING claims intentionally replay without re-entering the assembler.
      // Safe crash recovery needs explicit lease ownership; until that contract
      // exists, returning the durable claim is the fail-closed behavior.
      return {
        replayed: true,
        run: claim.run,
        revision: claim.run.revisionId
          ? await this.repository.getRevision(claim.run.revisionId)
          : null,
      };
    }

    let run = claim.run;
    try {
      run = await this.repository.advanceBuildPhase({
        storeId: request.storeId,
        runId,
        expectedPhase: "RECEIVED",
        nextPhase: "VALIDATING",
        at: this.now(),
      });
      run = await this.repository.advanceBuildPhase({
        storeId: request.storeId,
        runId,
        expectedPhase: "VALIDATING",
        nextPhase: "ASSEMBLING_REVISION",
        at: this.now(),
      });
      const candidateResult = StoreRevisionCandidateV1Schema.safeParse(
        await this.assembler.assemble({ request, inputDigest })
      );
      if (!candidateResult.success) {
        throw new StoreFactoryV2Error(
          "REVISION_CANDIDATE_INVALID",
          "Revision assembler returned an invalid candidate artifact."
        );
      }
      const candidate: StoreRevisionCandidateV1 = candidateResult.data;
      const qaReport = runDeterministicStoreRevisionQaV1(request, candidate);
      if (qaReport.status !== "PASS") {
        throw new StoreFactoryV2Error(
          "REVISION_QA_FAILED",
          `Revision candidate failed deterministic QA: ${qaReport.reasonCodes.join(",")}`
        );
      }
      const document = createStoreRevisionDocumentV2(
        request,
        candidate,
        qaReport,
        inputDigest
      );
      run = await this.repository.advanceBuildPhase({
        storeId: request.storeId,
        runId,
        expectedPhase: "ASSEMBLING_REVISION",
        nextPhase: "PERSISTING_REVISION",
        at: this.now(),
      });
      const finalized = await this.repository.finalizeBuildRevision({
        id: deterministicStoreFactoryIdV1(
          "srv",
          runId,
          inputDigest,
          document.outputDigest
        ),
        buildRunId: runId,
        storeId: request.storeId,
        inputDigest,
        outputDigest: document.outputDigest,
        catalogArtifactId: request.catalogBinding.artifactId,
        catalogBindingJson: canonicalJsonV1(request.catalogBinding),
        parentRevisionId: request.baseRevision?.revisionId ?? null,
        parentRevisionOutputDigest: request.baseRevision?.outputDigest ?? null,
        document,
        createdAt: this.now(),
        completedAt: this.now(),
      });
      return {
        replayed: false,
        run: finalized.run,
        revision: finalized.revision,
      };
    } catch (error) {
      const failure = safeBuildFailure(error);
      run = await this.repository.failBuildRun({
        storeId: request.storeId,
        runId,
        terminalState: "PARTIAL_FAILURE",
        completedAt: this.now(),
        failureCode: failure.code,
        failureMessage: failure.message,
      });
      return {
        replayed: false,
        run,
        revision: run.revisionId
          ? await this.repository.getRevision(run.revisionId)
          : null,
      };
    }
  }

  async approveRevision(input: unknown): Promise<RevisionReviewResultV1> {
    const request = RevisionReviewRequestV2Schema.parse(input);
    const revision = await this.repository.reviewRevision({
      storeId: request.storeId,
      revisionId: request.revisionId,
      expectedStatus: "DRAFT",
      expectedOutputDigest: request.expectedOutputDigest,
      nextStatus: "APPROVED",
      reviewedBy: request.reviewedBy,
      reason: request.reason,
      reviewedAt: this.now(),
    });
    return previewOnlyReviewResult(revision);
  }

  async rejectRevision(input: unknown): Promise<RevisionReviewResultV1> {
    const request = RevisionReviewRequestV2Schema.parse(input);
    const revision = await this.repository.reviewRevision({
      storeId: request.storeId,
      revisionId: request.revisionId,
      expectedStatus: "DRAFT",
      expectedOutputDigest: request.expectedOutputDigest,
      nextStatus: "REJECTED",
      reviewedBy: request.reviewedBy,
      reason: request.reason,
      reviewedAt: this.now(),
    });
    return previewOnlyReviewResult(revision);
  }

  async promotePreviewRevision(
    input: unknown
  ): Promise<PreviewPointerMutationResultV1> {
    const request = PreviewPointerMutationV1Schema.parse(input);
    const current = await this.repository.getPreviewPointer(request.storeId);
    if (current.activeRevisionId === request.targetRevisionId) {
      throw new StoreFactoryV2Error(
        "PREVIEW_TARGET_ALREADY_ACTIVE",
        "The requested revision is already active for preview."
      );
    }
    const target = await this.repository.getRevision(request.targetRevisionId);
    if (!target || target.storeId !== request.storeId) {
      throw new StoreFactoryV2Error(
        "REVISION_NOT_FOUND",
        "Preview target was not found for the requested store."
      );
    }
    if (target.status !== "APPROVED") {
      throw new StoreFactoryV2Error(
        "PREVIEW_REVISION_NOT_APPROVED",
        "Only an approved revision can become the active preview revision."
      );
    }
    if (current.activeRevisionId) {
      const active = await this.repository.getRevision(current.activeRevisionId);
      if (!active || target.revisionNumber <= active.revisionNumber) {
        throw new StoreFactoryV2Error(
          "PREVIEW_PROMOTION_TARGET_INVALID",
          "Promotion target must be newer than the active preview revision."
        );
      }
    }
    const pointer = await this.compareAndSwapPreview(request, "PROMOTE");
    return previewOnlyPointerResult(pointer);
  }

  async rollbackPreviewRevision(
    input: unknown
  ): Promise<PreviewPointerMutationResultV1> {
    const request = PreviewPointerMutationV1Schema.parse(input);
    const currentPointer = await this.repository.getPreviewPointer(
      request.storeId
    );
    if (currentPointer.version !== request.expectedPointerVersion) {
      throw previewPointerConflict(
        request.expectedPointerVersion,
        currentPointer.version
      );
    }
    if (!currentPointer.activeRevisionId) {
      throw new StoreFactoryV2Error(
        "PREVIEW_ROLLBACK_TARGET_INVALID",
        "There is no active preview revision to roll back."
      );
    }
    const [currentRevision, targetRevision] = await Promise.all([
      this.repository.getRevision(currentPointer.activeRevisionId),
      this.repository.getRevision(request.targetRevisionId),
    ]);
    if (!currentRevision || !targetRevision) {
      throw new StoreFactoryV2Error(
        "REVISION_NOT_FOUND",
        "The current or target preview revision no longer exists."
      );
    }
    if (
      currentRevision.storeId !== request.storeId ||
      targetRevision.storeId !== request.storeId
    ) {
      throw new StoreFactoryV2Error(
        "REVISION_STORE_MISMATCH",
        "Rollback revisions must belong to the requested store."
      );
    }
    if (
      targetRevision.status !== "APPROVED" ||
      targetRevision.revisionNumber >= currentRevision.revisionNumber
    ) {
      throw new StoreFactoryV2Error(
        "PREVIEW_ROLLBACK_TARGET_INVALID",
        "Rollback target must be an older approved revision of the same store."
      );
    }
    const pointer = await this.compareAndSwapPreview(request, "ROLLBACK");
    return previewOnlyPointerResult(pointer);
  }

  private async compareAndSwapPreview(
    request: PreviewPointerMutationV1,
    action: "PROMOTE" | "ROLLBACK"
  ): Promise<PreviewRevisionPointerV1> {
    const pointer = await this.repository.compareAndSwapPreviewPointer({
      storeId: request.storeId,
      targetRevisionId: request.targetRevisionId,
      expectedVersion: request.expectedPointerVersion,
      action,
      changedBy: request.changedBy,
      reason: request.reason,
      changedAt: this.now(),
    });
    if (!pointer) {
      const current = await this.repository.getPreviewPointer(request.storeId);
      throw previewPointerConflict(
        request.expectedPointerVersion,
        current.version
      );
    }
    return pointer;
  }

  private now(): string {
    const now = this.clock();
    if (Number.isNaN(now.getTime())) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Store Factory clock returned an invalid date."
      );
    }
    return now.toISOString();
  }
}

export const storeFactoryV2ContractVersions = Object.freeze({
  ...STORE_REVISION_CONTRACT_VERSIONS_V2,
  buildRequest: STORE_BUILD_REQUEST_V2,
  reviewRequest: REVISION_REVIEW_REQUEST_V2,
  pointerMutation: PREVIEW_POINTER_MUTATION_V1,
});

function previewOnlyReviewResult(
  revision: StoreRevisionV2
): RevisionReviewResultV1 {
  return {
    revision,
    scope: "PREVIEW_ONLY",
    liveStatusChanged: false,
  };
}

function previewOnlyPointerResult(
  pointer: PreviewRevisionPointerV1
): PreviewPointerMutationResultV1 {
  return {
    pointer,
    scope: "PREVIEW_ONLY",
    liveStatusChanged: false,
  };
}

function previewPointerConflict(
  expected: number,
  actual: number
): StoreFactoryV2Error {
  return new StoreFactoryV2Error(
    "PREVIEW_POINTER_CONFLICT",
    `Preview pointer compare-and-swap failed: expected version ${expected}, found ${actual}.`
  );
}

function safeBuildFailure(error: unknown): { code: string; message: string } {
  const code =
    error instanceof StoreFactoryV2Error ? error.code : "BUILD_PHASE_FAILED";
  const rawMessage = error instanceof Error ? error.message : "Unknown build failure.";
  const message = rawMessage.replace(/[\r\n\t]+/g, " ").trim().slice(0, 2_000);
  return { code, message: message || "Unknown build failure." };
}
