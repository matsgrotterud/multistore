import {
  PREVIEW_REVISION_POINTER_V1,
  STORE_BUILD_EVENT_V1,
  STORE_REVISION_V2,
  StoreRevisionDocumentV2Schema,
  canonicalJsonV1,
  deterministicStoreFactoryIdV1,
  type PreviewRevisionPointerV1,
  type StoreBuildEventV1,
  type StoreBuildRunV2,
  type StoreRevisionV2,
} from "./contracts";
import { StoreFactoryV2Error } from "./errors";
import type {
  AppendEventV1Input,
  ClaimBuildRunV1Result,
  CompareAndSwapPreviewV1Input,
  FailBuildRunV1Input,
  FinalizeBuildRevisionV1Input,
  FinalizeBuildRevisionV1Result,
  ReviewRevisionV1Input,
  StoreFactoryV2Repository,
} from "./repository";
import {
  assertBuildPhaseTransitionV1,
  assertBuildStateTransitionV1,
  assertRevisionStatusTransitionV1,
} from "./state-machine";

export interface InMemoryStoreFactoryV2RepositoryOptions {
  /** Deterministic test-only fault point after staging and before final commit. */
  beforeFinalizeCommit?: () => void;
}

/** Deterministic fake repository for core tests and offline callers. */
export class InMemoryStoreFactoryV2Repository
  implements StoreFactoryV2Repository
{
  private readonly runs = new Map<string, StoreBuildRunV2>();
  private readonly runIdByRequest = new Map<string, string>();
  private readonly revisions = new Map<string, StoreRevisionV2>();
  private readonly revisionIdByRun = new Map<string, string>();
  private readonly eventsByRun = new Map<string, StoreBuildEventV1[]>();
  private readonly pointers = new Map<string, PreviewRevisionPointerV1>();

  constructor(
    private readonly options: InMemoryStoreFactoryV2RepositoryOptions = {}
  ) {}

  async claimBuildRun(run: StoreBuildRunV2): Promise<ClaimBuildRunV1Result> {
    if (run.outputDigest !== null) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "A new build run cannot already have an output digest."
      );
    }
    const requestIdentity = buildRequestIdentity(run.storeId, run.requestKey);
    const existingId = this.runIdByRequest.get(requestIdentity);
    if (existingId) {
      const existing = this.requireRun(existingId);
      if (existing.inputDigest !== run.inputDigest) {
        throw new StoreFactoryV2Error(
          "BUILD_IDEMPOTENCY_CONFLICT",
          "The request key was already used for different build input."
        );
      }
      return { created: false, run: clone(existing) };
    }

    const idCollision = this.runs.get(run.id);
    if (idCollision) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        `Build run id collision: ${run.id}`
      );
    }

    const stored = clone(run);
    this.runs.set(stored.id, stored);
    this.runIdByRequest.set(requestIdentity, stored.id);
    this.appendEvent({
      buildRunId: stored.id,
      phase: stored.phase,
      type: "RUN_STARTED",
      payload: {
        requestKey: stored.requestKey,
        inputDigest: stored.inputDigest,
      },
      createdAt: stored.startedAt,
    });
    return { created: true, run: clone(stored) };
  }

  async findBuildRunByRequestKey(
    storeId: string,
    requestKey: string
  ): Promise<StoreBuildRunV2 | null> {
    const runId = this.runIdByRequest.get(buildRequestIdentity(storeId, requestKey));
    return runId ? clone(this.requireRun(runId)) : null;
  }

  async getBuildRun(runId: string): Promise<StoreBuildRunV2 | null> {
    const run = this.runs.get(runId);
    return run ? clone(run) : null;
  }

  async advanceBuildPhase(input: {
    storeId: string;
    runId: string;
    expectedPhase: StoreBuildRunV2["phase"];
    nextPhase: StoreBuildRunV2["phase"];
    at: string;
  }): Promise<StoreBuildRunV2> {
    const run = this.requireRun(input.runId);
    if (run.storeId !== input.storeId) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Build run does not belong to the requested store."
      );
    }
    if (run.state !== "RUNNING") {
      throw new StoreFactoryV2Error(
        "BUILD_ALREADY_TERMINAL",
        `Build run ${run.id} is already ${run.state}.`
      );
    }
    if (run.phase !== input.expectedPhase) {
      throw new StoreFactoryV2Error(
        "BUILD_PHASE_TRANSITION_INVALID",
        `Expected ${input.expectedPhase}, found ${run.phase}.`
      );
    }
    assertBuildPhaseTransitionV1(run.phase, input.nextPhase);
    const next = { ...run, phase: input.nextPhase };
    this.runs.set(run.id, next);
    this.appendEvent({
      buildRunId: run.id,
      phase: input.nextPhase,
      type: "PHASE_ENTERED",
      payload: { previousPhase: run.phase },
      createdAt: input.at,
    });
    return clone(next);
  }

  async finalizeBuildRevision(
    input: FinalizeBuildRevisionV1Input
  ): Promise<FinalizeBuildRevisionV1Result> {
    const run = this.requireRun(input.buildRunId);
    const document = StoreRevisionDocumentV2Schema.parse(input.document);
    if (
      run.storeId !== input.storeId ||
      run.inputDigest !== input.inputDigest ||
      document.inputDigest !== input.inputDigest ||
      input.outputDigest !== document.outputDigest ||
      run.outputDigest !== null ||
      run.briefJson !== canonicalJsonV1(document.brief) ||
      run.catalogShapeJson !== canonicalJsonV1(document.catalogShape) ||
      run.catalogArtifactId !== input.catalogArtifactId ||
      run.catalogBindingJson !== input.catalogBindingJson ||
      run.catalogBindingJson !== canonicalJsonV1(document.catalogBinding)
    ) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Revision identity does not match its build run."
      );
    }
    if (run.state !== "RUNNING" || run.phase !== "PERSISTING_REVISION") {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Revision can only be created in the PERSISTING_REVISION phase."
      );
    }

    const existingRevisionId = this.revisionIdByRun.get(run.id);
    if (existingRevisionId) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "A running build cannot already own a revision."
      );
    }
    if (this.revisions.has(input.id)) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        `Revision id collision: ${input.id}`
      );
    }

    const latestNumber = [...this.revisions.values()]
      .filter((revision) => revision.storeId === input.storeId)
      .reduce((highest, revision) => Math.max(highest, revision.revisionNumber), 0);
    if (input.parentRevisionId) {
      const parent = this.requireRevision(input.parentRevisionId);
      if (
        parent.storeId !== input.storeId ||
        parent.outputDigest !== input.parentRevisionOutputDigest ||
        parent.status !== "APPROVED" ||
        parent.document.experienceVariant !== "BASELINE" ||
        canonicalJsonV1(parent.catalogBinding) !== input.catalogBindingJson
      ) {
        throw new StoreFactoryV2Error(
          "REPOSITORY_INVARIANT_VIOLATION",
          "Base revision binding does not match the requested store and digest."
        );
      }
    } else if (input.parentRevisionOutputDigest !== null) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "A null base revision cannot carry an output digest."
      );
    }
    if (
      this.readPreviewPointer(input.storeId).activeRevisionId !==
      input.parentRevisionId
    ) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Base revision is no longer the active preview revision."
      );
    }
    const revision: StoreRevisionV2 = {
      contractVersion: STORE_REVISION_V2,
      id: input.id,
      storeId: input.storeId,
      buildRunId: input.buildRunId,
      revisionNumber: latestNumber + 1,
      parentRevisionId: input.parentRevisionId,
      catalogArtifactId: input.catalogArtifactId,
      catalogBinding: clone(document.catalogBinding),
      inputDigest: input.inputDigest,
      outputDigest: input.outputDigest,
      status: "DRAFT",
      document: clone(document),
      createdAt: input.createdAt,
      reviewedAt: null,
      reviewedBy: null,
      reviewReason: null,
    };
    assertBuildPhaseTransitionV1(run.phase, "COMPLETED");
    assertBuildStateTransitionV1(run.state, "SUCCEEDED");
    const settled: StoreBuildRunV2 = {
      ...run,
      state: "SUCCEEDED",
      phase: "COMPLETED",
      outputDigest: revision.outputDigest,
      revisionId: revision.id,
      failureCode: null,
      failureMessage: null,
      completedAt: input.completedAt,
    };
    const priorEvents = this.eventsByRun.get(run.id) ?? [];
    const revisionCreated = makeEvent(
      {
        buildRunId: run.id,
        phase: run.phase,
        type: "REVISION_CREATED",
        payload: {
          revisionId: revision.id,
          revisionNumber: revision.revisionNumber,
          parentRevisionId: revision.parentRevisionId,
          outputDigest: revision.outputDigest,
        },
        createdAt: input.createdAt,
      },
      priorEvents.length + 1
    );
    const runSucceeded = makeEvent(
      {
        buildRunId: run.id,
        phase: "COMPLETED",
        type: "RUN_SUCCEEDED",
        payload: {
          state: "SUCCEEDED",
          failureCode: null,
          outputDigest: settled.outputDigest,
        },
        createdAt: input.completedAt,
      },
      priorEvents.length + 2
    );

    // Nothing is visible before this hook. A thrown fault therefore models a
    // transaction rollback without leaving a revision or success event.
    this.options.beforeFinalizeCommit?.();
    this.revisions.set(revision.id, revision);
    this.revisionIdByRun.set(run.id, revision.id);
    this.runs.set(run.id, settled);
    this.eventsByRun.set(run.id, [
      ...priorEvents,
      revisionCreated,
      runSucceeded,
    ]);
    return { run: clone(settled), revision: clone(revision) };
  }

  async failBuildRun(input: FailBuildRunV1Input): Promise<StoreBuildRunV2> {
    const run = this.requireRun(input.runId);
    if (run.storeId !== input.storeId) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Build run does not belong to the requested store."
      );
    }
    if (
      !(["PARTIAL_FAILURE", "FAILED", "CANCELLED"] as const).includes(
        input.terminalState
      )
    ) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "Successful builds require atomic revision finalization."
      );
    }
    assertBuildStateTransitionV1(run.state, input.terminalState);
    if (run.revisionId || this.revisionIdByRun.has(run.id)) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "A build that owns a revision cannot enter a failure state."
      );
    }
    if (!input.failureCode?.trim() || !input.failureMessage?.trim()) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        "A failed build requires a failure code and message."
      );
    }

    const settled: StoreBuildRunV2 = {
      ...run,
      state: input.terminalState,
      outputDigest: null,
      failureCode: input.failureCode.trim(),
      failureMessage: input.failureMessage.trim(),
      completedAt: input.completedAt,
    };
    const priorEvents = this.eventsByRun.get(run.id) ?? [];
    const failedEvent = makeEvent(
      {
        buildRunId: run.id,
        phase: run.phase,
        type: "RUN_FAILED",
        payload: {
          state: input.terminalState,
          failureCode: settled.failureCode,
          outputDigest: null,
        },
        createdAt: input.completedAt,
      },
      priorEvents.length + 1
    );
    this.runs.set(run.id, settled);
    this.eventsByRun.set(run.id, [...priorEvents, failedEvent]);
    return clone(settled);
  }

  async getRevision(revisionId: string): Promise<StoreRevisionV2 | null> {
    const revision = this.revisions.get(revisionId);
    return revision ? clone(revision) : null;
  }

  async reviewRevision(
    input: ReviewRevisionV1Input
  ): Promise<StoreRevisionV2> {
    const revision = this.requireRevision(input.revisionId);
    if (revision.storeId !== input.storeId) {
      throw new StoreFactoryV2Error(
        "REVISION_STORE_MISMATCH",
        "Revision does not belong to the requested store."
      );
    }
    if (
      revision.status !== input.expectedStatus ||
      revision.outputDigest !== input.expectedOutputDigest
    ) {
      throw new StoreFactoryV2Error(
        "REVISION_STATUS_CONFLICT",
        `Expected revision status ${input.expectedStatus}, found ${revision.status}.`
      );
    }
    assertRevisionStatusTransitionV1(revision.status, input.nextStatus);
    const reviewed: StoreRevisionV2 = {
      ...revision,
      status: input.nextStatus,
      reviewedAt: input.reviewedAt,
      reviewedBy: input.reviewedBy,
      reviewReason: input.reason,
    };
    this.revisions.set(reviewed.id, reviewed);
    const run = this.requireRun(reviewed.buildRunId);
    this.appendEvent({
      buildRunId: run.id,
      phase: run.phase,
      type:
        input.nextStatus === "APPROVED"
          ? "REVISION_APPROVED"
          : "REVISION_REJECTED",
      payload: {
        revisionId: reviewed.id,
        reviewedBy: input.reviewedBy,
        reason: input.reason,
      },
      createdAt: input.reviewedAt,
    });
    return clone(reviewed);
  }

  async getPreviewPointer(storeId: string): Promise<PreviewRevisionPointerV1> {
    return clone(this.readPreviewPointer(storeId));
  }

  async compareAndSwapPreviewPointer(
    input: CompareAndSwapPreviewV1Input
  ): Promise<PreviewRevisionPointerV1 | null> {
    const revision = this.requireRevision(input.targetRevisionId);
    if (revision.storeId !== input.storeId) {
      throw new StoreFactoryV2Error(
        "REVISION_STORE_MISMATCH",
        "Preview revision does not belong to the requested store."
      );
    }
    if (revision.status !== "APPROVED") {
      throw new StoreFactoryV2Error(
        "PREVIEW_REVISION_NOT_APPROVED",
        "Only an approved revision can become the active preview revision."
      );
    }

    // No await before this check-and-write pair: the fake preserves the same
    // atomic CAS boundary required from a database implementation.
    const current = this.readPreviewPointer(input.storeId);
    if (current.version !== input.expectedVersion) return null;
    if (current.activeRevisionId) {
      const active = this.requireRevision(current.activeRevisionId);
      const correctlyDirected =
        input.action === "PROMOTE"
          ? revision.revisionNumber > active.revisionNumber
          : revision.revisionNumber < active.revisionNumber;
      if (!correctlyDirected) {
        throw new StoreFactoryV2Error(
          input.action === "PROMOTE"
            ? "PREVIEW_PROMOTION_TARGET_INVALID"
            : "PREVIEW_ROLLBACK_TARGET_INVALID",
          `${input.action} target has the wrong revision direction.`
        );
      }
    } else if (input.action === "ROLLBACK") {
      throw new StoreFactoryV2Error(
        "PREVIEW_ROLLBACK_TARGET_INVALID",
        "There is no active preview revision to roll back."
      );
    }

    const next: PreviewRevisionPointerV1 = {
      contractVersion: PREVIEW_REVISION_POINTER_V1,
      storeId: input.storeId,
      activeRevisionId: input.targetRevisionId,
      version: current.version + 1,
      lastAction: input.action,
      changedBy: input.changedBy,
      changeReason: input.reason,
      updatedAt: input.changedAt,
    };
    this.pointers.set(input.storeId, next);
    const run = this.requireRun(revision.buildRunId);
    this.appendEvent({
      buildRunId: run.id,
      phase: run.phase,
      type:
        input.action === "PROMOTE"
          ? "PREVIEW_PROMOTED"
          : "PREVIEW_ROLLED_BACK",
      payload: {
        revisionId: revision.id,
        previousRevisionId: current.activeRevisionId,
        previousPointerVersion: current.version,
        pointerVersion: next.version,
        changedBy: input.changedBy,
        reason: input.reason,
        scope: "PREVIEW_ONLY",
        liveStatusChanged: false,
      },
      createdAt: input.changedAt,
    });
    return clone(next);
  }

  async listBuildEvents(buildRunId: string): Promise<StoreBuildEventV1[]> {
    return clone(this.eventsByRun.get(buildRunId) ?? []);
  }

  async listStoreBuildEvents(storeId: string): Promise<StoreBuildEventV1[]> {
    return clone(
      [...this.runs.values()]
        .filter((run) => run.storeId === storeId)
        .flatMap((run) => this.eventsByRun.get(run.id) ?? [])
        .sort(
          (left, right) =>
            left.createdAt.localeCompare(right.createdAt) ||
            left.buildRunId.localeCompare(right.buildRunId) ||
            left.sequence - right.sequence
        )
    );
  }

  private appendEvent(input: AppendEventV1Input): StoreBuildEventV1 {
    this.requireRun(input.buildRunId);
    const events = this.eventsByRun.get(input.buildRunId) ?? [];
    const sequence = events.length + 1;
    const event = makeEvent(input, sequence);
    events.push(event);
    this.eventsByRun.set(input.buildRunId, events);
    return event;
  }

  private requireRun(runId: string): StoreBuildRunV2 {
    const run = this.runs.get(runId);
    if (!run) {
      throw new StoreFactoryV2Error(
        "REPOSITORY_INVARIANT_VIOLATION",
        `Unknown build run: ${runId}`
      );
    }
    return run;
  }

  private readPreviewPointer(storeId: string): PreviewRevisionPointerV1 {
    return (
      this.pointers.get(storeId) ?? {
        contractVersion: PREVIEW_REVISION_POINTER_V1,
        storeId,
        activeRevisionId: null,
        version: 0,
        lastAction: "NONE",
        changedBy: null,
        changeReason: null,
        updatedAt: null,
      }
    );
  }

  private requireRevision(revisionId: string): StoreRevisionV2 {
    const revision = this.revisions.get(revisionId);
    if (!revision) {
      throw new StoreFactoryV2Error(
        "REVISION_NOT_FOUND",
        `Unknown store revision: ${revisionId}`
      );
    }
    return revision;
  }
}

function buildRequestIdentity(storeId: string, requestKey: string): string {
  return `${storeId}\u001f${requestKey}`;
}

function makeEvent(
  input: AppendEventV1Input,
  sequence: number
): StoreBuildEventV1 {
  return {
    contractVersion: STORE_BUILD_EVENT_V1,
    id: deterministicStoreFactoryIdV1("sbe", input.buildRunId, sequence),
    buildRunId: input.buildRunId,
    sequence,
    phase: input.phase,
    type: input.type,
    payload: clone(input.payload ?? {}),
    createdAt: input.createdAt,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
