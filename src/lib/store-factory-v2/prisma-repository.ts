import {
  BuildPhaseV1Schema,
  BuildRunStateV1Schema,
  BuildTerminalStateV1Schema,
  CatalogBindingV1Schema,
  CatalogShapeV1Schema,
  PREVIEW_REVISION_POINTER_V1,
  RevisionStatusV1Schema,
  STORE_BUILD_EVENT_V1,
  STORE_BUILD_RUN_V2,
  STORE_REVISION_V2,
  StoreBriefV1Schema,
  StoreBuildEventTypeV1Schema,
  StoreBuildRequestV2Schema,
  StoreRevisionDocumentV2Schema,
  canonicalJsonV1,
  deriveStoreBuildRequestKeyV2,
  deterministicStoreFactoryIdV1,
  storeBuildInputDigestV2,
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

/**
 * Deliberately small Prisma-compatible boundary. Keeping the transaction and
 * parameterized raw-query surface injectable makes repository tests offline
 * and avoids importing the process-global database client at module load.
 */
export interface StoreFactoryV2PrismaTransaction {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}

export interface StoreFactoryV2PrismaClient
  extends StoreFactoryV2PrismaTransaction {
  $transaction<T>(
    callback: (transaction: StoreFactoryV2PrismaTransaction) => Promise<T>
  ): Promise<T>;
}

type BuildRunRow = {
  id: string;
  storeId: string;
  contractVersion: string;
  requestKey: string;
  inputDigest: string;
  outputDigest: string | null;
  requestedBy: string;
  requestJson: string;
  status: string;
  phase: string;
  briefJson: string;
  catalogShapeJson: string;
  catalogArtifactId: string;
  catalogBindingJson: string;
  revisionId: string | null;
  revisionOutputDigest: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  startedAt: Date | string;
  completedAt: Date | string | null;
};

type RevisionRow = {
  id: string;
  storeId: string;
  buildRunId: string;
  revisionNumber: number;
  parentRevisionId: string | null;
  catalogArtifactId: string;
  catalogBindingJson: string;
  contractVersion: string;
  inputDigest: string;
  outputDigest: string;
  status: string;
  revisionJson: string;
  createdAt: Date | string;
  reviewedAt: Date | string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
};

type EventRow = {
  id: string;
  buildRunId: string;
  sequence: number;
  contractVersion: string;
  phase: string;
  eventType: string;
  payloadJson: string;
  createdAt: Date | string;
};

type PointerRow = {
  storeId: string;
  activePreviewRevisionId: string | null;
  contractVersion: string;
  version: number;
  lastAction: string;
  changedBy: string | null;
  changeReason: string | null;
  updatedAt: Date | string;
};

const buildRunProjection = `
  SELECT run."id", run."storeId", run."contractVersion", run."requestKey",
         run."inputDigest", run."outputDigest", run."requestedBy", run."requestJson",
         run."status", run."phase", run."briefJson", run."catalogShapeJson",
         run."catalogArtifactId", run."catalogBindingJson", run."failureCode",
         run."failureMessage", run."startedAt", run."completedAt",
         revision."id" AS "revisionId",
         revision."outputDigest" AS "revisionOutputDigest"
  FROM "StoreBuildRun" run
  LEFT JOIN "StoreRevision" revision ON revision."buildRunId" = run."id"`;

const revisionProjection = `
  SELECT "id", "storeId", "buildRunId", "revisionNumber",
         "parentRevisionId", "catalogArtifactId", "catalogBindingJson",
         "contractVersion", "inputDigest", "outputDigest", "status",
         "revisionJson", "createdAt", "reviewedAt", "reviewedBy",
         "reviewReason"
  FROM "StoreRevision"`;

/**
 * Durable repository for the internal Store Factory preview control plane.
 * Every write and its audit event commit in one database transaction. No SQL
 * in this adapter references or mutates Store.launchStatus.
 */
export class PrismaStoreFactoryV2Repository
  implements StoreFactoryV2Repository
{
  private readonly db: StoreFactoryV2PrismaClient;

  constructor(db: StoreFactoryV2PrismaClient) {
    this.db = db;
  }

  async claimBuildRun(run: StoreBuildRunV2): Promise<ClaimBuildRunV1Result> {
    assertInitialRun(run);
    const existing = await this.findBuildRunByRequestKey(
      run.storeId,
      run.requestKey
    );
    if (existing) return replayResult(existing, run.inputDigest);

    try {
      return await this.db.$transaction(async (transaction) => {
        await lockActivePreviewStore(transaction, run.storeId);
        const rows = await transaction.$queryRawUnsafe<BuildRunRow[]>(
           `INSERT INTO "StoreBuildRun" (
             "id", "storeId", "contractVersion", "requestKey", "inputDigest", "outputDigest",
             "requestedBy", "requestJson", "status", "phase", "briefJson",
             "catalogShapeJson", "catalogArtifactId", "catalogBindingJson",
             "failureCode", "failureMessage", "startedAt",
             "completedAt"
           ) VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, 'RUNNING', 'RECEIVED', $8, $9,
                     $10, $11, NULL, NULL, $12, NULL)
           RETURNING "id", "storeId", "contractVersion", "requestKey",
                     "inputDigest", "outputDigest", "requestedBy", "requestJson",
                     "status", "phase", "briefJson", "catalogShapeJson",
                     "catalogArtifactId", "catalogBindingJson", NULL::text AS "revisionId",
                     NULL::text AS "revisionOutputDigest",
                     "failureCode", "failureMessage", "startedAt", "completedAt"`,
          run.id,
          run.storeId,
          run.contractVersion,
          run.requestKey,
          run.inputDigest,
          run.requestedBy,
          run.requestJson,
          run.briefJson,
          run.catalogShapeJson,
          run.catalogArtifactId,
          run.catalogBindingJson,
          toDate(run.startedAt, "startedAt")
        );
        const stored = requireOne(rows, "Build run insert returned no row.");
        await appendEvent(transaction, run.storeId, {
          buildRunId: run.id,
          phase: "RECEIVED",
          type: "RUN_STARTED",
          payload: {
            requestKey: run.requestKey,
            inputDigest: run.inputDigest,
          },
          createdAt: run.startedAt,
        });
        return { created: true, run: toBuildRun(stored) };
      });
    } catch (error) {
      if (!isUniqueConstraint(error)) throw normalizePersistenceError(error);
      const winner = await this.findBuildRunByRequestKey(
        run.storeId,
        run.requestKey
      );
      if (!winner) throw normalizePersistenceError(error);
      return replayResult(winner, run.inputDigest);
    }
  }

  async findBuildRunByRequestKey(
    storeId: string,
    requestKey: string
  ): Promise<StoreBuildRunV2 | null> {
    const rows = await this.db.$queryRawUnsafe<BuildRunRow[]>(
      `${buildRunProjection}
       WHERE run."storeId" = $1 AND run."requestKey" = $2
       LIMIT 1`,
      storeId,
      requestKey
    );
    return rows[0] ? toBuildRun(rows[0]) : null;
  }

  async getBuildRun(runId: string): Promise<StoreBuildRunV2 | null> {
    const rows = await this.db.$queryRawUnsafe<BuildRunRow[]>(
      `${buildRunProjection} WHERE run."id" = $1 LIMIT 1`,
      runId
    );
    return rows[0] ? toBuildRun(rows[0]) : null;
  }

  async advanceBuildPhase(input: {
    storeId: string;
    runId: string;
    expectedPhase: StoreBuildRunV2["phase"];
    nextPhase: StoreBuildRunV2["phase"];
    at: string;
  }): Promise<StoreBuildRunV2> {
    return this.db.$transaction(async (transaction) => {
      await lockActivePreviewStore(transaction, input.storeId);
      const current = await lockedBuildRun(
        transaction,
        input.storeId,
        input.runId
      );
      if (current.state !== "RUNNING") {
        throw new StoreFactoryV2Error(
          "BUILD_ALREADY_TERMINAL",
          `Build run ${current.id} is already ${current.state}.`
        );
      }
      if (current.phase !== input.expectedPhase) {
        throw new StoreFactoryV2Error(
          "BUILD_PHASE_TRANSITION_INVALID",
          `Expected ${input.expectedPhase}, found ${current.phase}.`
        );
      }
      const rows = await transaction.$queryRawUnsafe<BuildRunRow[]>(
        `UPDATE "StoreBuildRun" run
         SET "phase" = $1
         WHERE run."id" = $2 AND run."storeId" = $3
           AND run."status" = 'RUNNING' AND run."phase" = $4
         RETURNING run."id", run."storeId", run."contractVersion",
                   run."requestKey", run."inputDigest", run."outputDigest", run."requestedBy",
                   run."requestJson", run."status", run."phase", run."briefJson",
                   run."catalogShapeJson", run."catalogArtifactId", run."catalogBindingJson",
                   (SELECT revision."id" FROM "StoreRevision" revision
                    WHERE revision."buildRunId" = run."id") AS "revisionId",
                   (SELECT revision."outputDigest" FROM "StoreRevision" revision
                    WHERE revision."buildRunId" = run."id") AS "revisionOutputDigest",
                   run."failureCode", run."failureMessage", run."startedAt",
                   run."completedAt"`,
        input.nextPhase,
        input.runId,
        input.storeId,
        input.expectedPhase
      );
      const updated = requireOne(rows, "Build phase update lost its tenant scope.");
      await appendEvent(transaction, input.storeId, {
        buildRunId: input.runId,
        phase: input.nextPhase,
        type: "PHASE_ENTERED",
        payload: { previousPhase: input.expectedPhase },
        createdAt: input.at,
      });
      return toBuildRun(updated);
    });
  }

  async finalizeBuildRevision(
    input: FinalizeBuildRevisionV1Input
  ): Promise<FinalizeBuildRevisionV1Result> {
    return this.db.$transaction(async (transaction) => {
      const document = StoreRevisionDocumentV2Schema.parse(input.document);
      await lockActivePreviewStore(transaction, input.storeId);
      const run = await lockedBuildRun(
        transaction,
        input.storeId,
        input.buildRunId
      );
      if (
        run.state !== "RUNNING" ||
        run.phase !== "PERSISTING_REVISION" ||
        run.inputDigest !== input.inputDigest ||
        document.inputDigest !== input.inputDigest ||
        run.outputDigest !== null ||
        input.outputDigest !== document.outputDigest ||
        run.briefJson !== canonicalJsonV1(document.brief) ||
        run.catalogShapeJson !== canonicalJsonV1(document.catalogShape) ||
        run.catalogArtifactId !== input.catalogArtifactId ||
        run.catalogBindingJson !== input.catalogBindingJson ||
        run.catalogBindingJson !== canonicalJsonV1(document.catalogBinding)
      ) {
        throw invariant("Revision identity does not match its build run.");
      }

      const existingRows = await transaction.$queryRawUnsafe<RevisionRow[]>(
        `${revisionProjection} WHERE "buildRunId" = $1 FOR UPDATE`,
        input.buildRunId
      );
      if (existingRows[0]) {
        throw invariant("A running build cannot already own a revision.");
      }

      const latestRows = await transaction.$queryRawUnsafe<
        Array<{ revisionNumber: number }>
      >(
        `SELECT "revisionNumber" FROM "StoreRevision"
         WHERE "storeId" = $1 ORDER BY "revisionNumber" DESC LIMIT 1`,
        input.storeId
      );
      if (input.parentRevisionId) {
        const parentRows = await transaction.$queryRawUnsafe<RevisionRow[]>(
          `${revisionProjection} WHERE "id" = $1 AND "storeId" = $2 FOR UPDATE`,
          input.parentRevisionId,
          input.storeId
        );
        const parent = parentRows[0] ? toRevision(parentRows[0]) : null;
        if (
          !parent ||
          parent.status !== "APPROVED" ||
          parent.document.experienceVariant !== "BASELINE" ||
          parent.outputDigest !== input.parentRevisionOutputDigest ||
          canonicalJsonV1(parent.catalogBinding) !== input.catalogBindingJson
        ) {
          throw invariant("Base revision binding does not match store and digest.");
        }
      } else if (input.parentRevisionOutputDigest !== null) {
        throw invariant("A null base revision cannot carry an output digest.");
      }
      const revisionNumber = (latestRows[0]?.revisionNumber ?? 0) + 1;
      const parentRevisionId = input.parentRevisionId;
      const revisionJson = canonicalJsonV1(document);
      const rows = await transaction.$queryRawUnsafe<RevisionRow[]>(
        `INSERT INTO "StoreRevision" (
           "id", "storeId", "buildRunId", "revisionNumber",
           "parentRevisionId", "catalogArtifactId", "catalogBindingJson",
           "contractVersion", "inputDigest", "outputDigest", "status",
           "briefJson", "catalogShapeJson", "revisionJson", "createdAt",
           "reviewedAt", "reviewedBy", "reviewReason"
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DRAFT', $11, $12, $13, $14,
                   NULL, NULL, NULL)
         RETURNING "id", "storeId", "buildRunId", "revisionNumber",
                   "parentRevisionId", "catalogArtifactId", "catalogBindingJson",
                   "contractVersion", "inputDigest", "outputDigest",
                   "status", "revisionJson", "createdAt", "reviewedAt",
                   "reviewedBy", "reviewReason"`,
        input.id,
        input.storeId,
        input.buildRunId,
        revisionNumber,
        parentRevisionId,
        input.catalogArtifactId,
        input.catalogBindingJson,
        STORE_REVISION_V2,
        input.inputDigest,
        input.outputDigest,
        canonicalJsonV1(document.brief),
        canonicalJsonV1(document.catalogShape),
        revisionJson,
        toDate(input.createdAt, "createdAt")
      );
      const revision = toRevision(
        requireOne(rows, "Revision insert returned no row.")
      );
      await appendEvent(transaction, input.storeId, {
        buildRunId: input.buildRunId,
        phase: run.phase,
        type: "REVISION_CREATED",
        payload: {
          revisionId: revision.id,
          revisionNumber,
          parentRevisionId,
          outputDigest: revision.outputDigest,
        },
        createdAt: input.createdAt,
      });
      const runRows = await transaction.$queryRawUnsafe<BuildRunRow[]>(
        `UPDATE "StoreBuildRun" run
         SET "status" = 'SUCCEEDED', "phase" = 'COMPLETED',
             "outputDigest" = $1, "failureCode" = NULL,
             "failureMessage" = NULL, "completedAt" = $2
         WHERE run."id" = $3 AND run."storeId" = $4
           AND run."status" = 'RUNNING'
           AND run."phase" = 'PERSISTING_REVISION'
         RETURNING run."id", run."storeId", run."contractVersion",
                   run."requestKey", run."inputDigest", run."outputDigest",
                   run."requestedBy", run."requestJson", run."status", run."phase",
                   run."briefJson", run."catalogShapeJson", run."catalogArtifactId",
                   run."catalogBindingJson",
                   (SELECT stored_revision."id" FROM "StoreRevision" stored_revision
                    WHERE stored_revision."buildRunId" = run."id") AS "revisionId",
                   (SELECT stored_revision."outputDigest" FROM "StoreRevision" stored_revision
                    WHERE stored_revision."buildRunId" = run."id") AS "revisionOutputDigest",
                   run."failureCode", run."failureMessage", run."startedAt",
                   run."completedAt"`,
        revision.outputDigest,
        toDate(input.completedAt, "completedAt"),
        input.buildRunId,
        input.storeId
      );
      const settled = toBuildRun(
        requireOne(runRows, "Atomic build finalization lost its tenant scope.")
      );
      await appendEvent(transaction, input.storeId, {
        buildRunId: input.buildRunId,
        phase: "COMPLETED",
        type: "RUN_SUCCEEDED",
        payload: {
          state: "SUCCEEDED",
          failureCode: null,
          outputDigest: settled.outputDigest,
        },
        createdAt: input.completedAt,
      });
      return { run: settled, revision };
    });
  }

  async failBuildRun(input: FailBuildRunV1Input): Promise<StoreBuildRunV2> {
    return this.db.$transaction(async (transaction) => {
      await lockActivePreviewStore(transaction, input.storeId);
      const current = await lockedBuildRun(
        transaction,
        input.storeId,
        input.runId
      );
      if (current.state !== "RUNNING") {
        throw new StoreFactoryV2Error(
          "BUILD_ALREADY_TERMINAL",
          `Build run ${current.id} is already ${current.state}.`
        );
      }
      const terminalState = BuildTerminalStateV1Schema.parse(
        input.terminalState
      );
      if (terminalState === "SUCCEEDED") {
        throw invariant("Successful builds require atomic revision finalization.");
      }
      if (current.revisionId) {
        throw invariant("A build that owns a revision cannot enter a failure state.");
      }
      if (!input.failureCode.trim() || !input.failureMessage.trim()) {
        throw invariant("A failed build requires a failure code and message.");
      }
      const rows = await transaction.$queryRawUnsafe<BuildRunRow[]>(
        `UPDATE "StoreBuildRun" run
         SET "status" = $1, "outputDigest" = NULL,
             "failureCode" = $2, "failureMessage" = $3, "completedAt" = $4
         WHERE run."id" = $5 AND run."storeId" = $6
           AND run."status" = 'RUNNING' AND run."phase" = $7
           AND NOT EXISTS (
             SELECT 1 FROM "StoreRevision" revision
             WHERE revision."buildRunId" = run."id"
           )
         RETURNING run."id", run."storeId", run."contractVersion",
                   run."requestKey", run."inputDigest", run."outputDigest", run."requestedBy",
                   run."requestJson", run."status", run."phase", run."briefJson",
                   run."catalogShapeJson", run."catalogArtifactId", run."catalogBindingJson",
                   (SELECT revision."id" FROM "StoreRevision" revision
                    WHERE revision."buildRunId" = run."id") AS "revisionId",
                   (SELECT revision."outputDigest" FROM "StoreRevision" revision
                    WHERE revision."buildRunId" = run."id") AS "revisionOutputDigest",
                   run."failureCode", run."failureMessage", run."startedAt",
                   run."completedAt"`,
        terminalState,
        input.failureCode.trim(),
        input.failureMessage.trim(),
        toDate(input.completedAt, "completedAt"),
        input.runId,
        input.storeId,
        current.phase
      );
      const settled = toBuildRun(
        requireOne(rows, "Build settlement lost its tenant scope.")
      );
      await appendEvent(transaction, input.storeId, {
        buildRunId: input.runId,
        phase: current.phase,
        type: "RUN_FAILED",
        payload: {
          state: terminalState,
          failureCode: settled.failureCode,
          outputDigest: settled.outputDigest,
        },
        createdAt: input.completedAt,
      });
      return settled;
    });
  }

  async getRevision(revisionId: string): Promise<StoreRevisionV2 | null> {
    const rows = await this.db.$queryRawUnsafe<RevisionRow[]>(
      `${revisionProjection} WHERE "id" = $1 LIMIT 1`,
      revisionId
    );
    return rows[0] ? toRevision(rows[0]) : null;
  }

  async reviewRevision(input: ReviewRevisionV1Input): Promise<StoreRevisionV2> {
    return this.db.$transaction(async (transaction) => {
      await lockActivePreviewStore(transaction, input.storeId);
      const currentRows = await transaction.$queryRawUnsafe<RevisionRow[]>(
        `${revisionProjection}
         WHERE "id" = $1 AND "storeId" = $2 FOR UPDATE`,
        input.revisionId,
        input.storeId
      );
      const current = currentRows[0];
      if (!current) {
        throw new StoreFactoryV2Error(
          "REVISION_NOT_FOUND",
          "Revision was not found for the requested store."
        );
      }
      if (
        current.status !== input.expectedStatus ||
        current.outputDigest !== input.expectedOutputDigest
      ) {
        throw new StoreFactoryV2Error(
          "REVISION_STATUS_CONFLICT",
          `Expected revision status ${input.expectedStatus}, found ${current.status}.`
        );
      }
      const rows = await transaction.$queryRawUnsafe<RevisionRow[]>(
        `UPDATE "StoreRevision"
         SET "status" = $1, "reviewedAt" = $2, "reviewedBy" = $3,
             "reviewReason" = $4
         WHERE "id" = $5 AND "storeId" = $6 AND "status" = $7
           AND "outputDigest" = $8
         RETURNING "id", "storeId", "buildRunId", "revisionNumber",
                   "parentRevisionId", "catalogArtifactId", "catalogBindingJson",
                   "contractVersion", "inputDigest", "outputDigest",
                   "status", "revisionJson", "createdAt", "reviewedAt",
                   "reviewedBy", "reviewReason"`,
        input.nextStatus,
        toDate(input.reviewedAt, "reviewedAt"),
        input.reviewedBy,
        input.reason,
        input.revisionId,
        input.storeId,
        input.expectedStatus,
        input.expectedOutputDigest
      );
      const reviewed = toRevision(
        requireOne(rows, "Revision review lost its tenant scope.")
      );
      await appendEvent(transaction, input.storeId, {
        buildRunId: reviewed.buildRunId,
        phase: await buildRunPhase(
          transaction,
          input.storeId,
          reviewed.buildRunId
        ),
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
      return reviewed;
    });
  }

  async getPreviewPointer(storeId: string): Promise<PreviewRevisionPointerV1> {
    const rows = await this.db.$queryRawUnsafe<PointerRow[]>(
      `SELECT "storeId", "activePreviewRevisionId", "contractVersion",
              "version", "lastAction", "changedBy", "changeReason", "updatedAt"
       FROM "StorePreviewRevisionPointer" WHERE "storeId" = $1`,
      storeId
    );
    return rows[0] ? toPointer(rows[0]) : emptyPointer(storeId);
  }

  async compareAndSwapPreviewPointer(
    input: CompareAndSwapPreviewV1Input
  ): Promise<PreviewRevisionPointerV1 | null> {
    return this.db.$transaction(async (transaction) => {
      await lockActivePreviewStore(transaction, input.storeId);
      const beforeRows = await transaction.$queryRawUnsafe<PointerRow[]>(
        `SELECT "storeId", "activePreviewRevisionId", "contractVersion",
                "version", "lastAction", "changedBy", "changeReason", "updatedAt"
         FROM "StorePreviewRevisionPointer" WHERE "storeId" = $1`,
        input.storeId
      );
      const targetRows = await transaction.$queryRawUnsafe<
        Array<{ buildRunId: string }>
      >(
        `SELECT "buildRunId" FROM "StoreRevision"
         WHERE "id" = $1 AND "storeId" = $2`,
        input.targetRevisionId,
        input.storeId
      );
      const target = targetRows[0];
      if (!target) {
        throw new StoreFactoryV2Error(
          "REVISION_NOT_FOUND",
          "Preview target was not found for the requested store."
        );
      }
      const swappedRows = await transaction.$queryRawUnsafe<
        Array<{ swapped: boolean }>
      >(
        `SELECT "compareAndSwapStorePreviewRevisionV1"(
           $1, $2, $3, $4, $5, $6, $7
         ) AS "swapped"`,
        input.storeId,
        input.expectedVersion,
        input.targetRevisionId,
        input.action,
        input.changedBy,
        input.reason,
        toDate(input.changedAt, "changedAt")
      );
      if (swappedRows[0]?.swapped !== true) return null;

      const afterRows = await transaction.$queryRawUnsafe<PointerRow[]>(
        `SELECT "storeId", "activePreviewRevisionId", "contractVersion",
                "version", "lastAction", "changedBy", "changeReason", "updatedAt"
         FROM "StorePreviewRevisionPointer" WHERE "storeId" = $1`,
        input.storeId
      );
      const pointer = toPointer(
        requireOne(afterRows, "Preview CAS succeeded without a pointer row.")
      );
      await appendEvent(transaction, input.storeId, {
        buildRunId: target.buildRunId,
        phase: await buildRunPhase(transaction, input.storeId, target.buildRunId),
        type:
          input.action === "PROMOTE"
            ? "PREVIEW_PROMOTED"
            : "PREVIEW_ROLLED_BACK",
        payload: {
          revisionId: input.targetRevisionId,
          previousRevisionId:
            beforeRows[0]?.activePreviewRevisionId ?? null,
          previousPointerVersion: input.expectedVersion,
          pointerVersion: pointer.version,
          changedBy: input.changedBy,
          reason: input.reason,
          scope: "PREVIEW_ONLY",
          liveStatusChanged: false,
        },
        createdAt: input.changedAt,
      });
      return pointer;
    });
  }

  async listBuildEvents(buildRunId: string): Promise<StoreBuildEventV1[]> {
    const rows = await this.db.$queryRawUnsafe<EventRow[]>(
      `SELECT "id", "buildRunId", "sequence", "contractVersion", "phase",
              "eventType", "payloadJson", "createdAt"
       FROM "StoreBuildEvent" WHERE "buildRunId" = $1
       ORDER BY "sequence" ASC`,
      buildRunId
    );
    return rows.map(toEvent);
  }

  async listStoreBuildEvents(storeId: string): Promise<StoreBuildEventV1[]> {
    const rows = await this.db.$queryRawUnsafe<EventRow[]>(
      `SELECT event."id", event."buildRunId", event."sequence",
              event."contractVersion", event."phase", event."eventType",
              event."payloadJson", event."createdAt"
       FROM "StoreBuildEvent" event
       INNER JOIN "StoreBuildRun" run ON run."id" = event."buildRunId"
       WHERE run."storeId" = $1
       ORDER BY event."createdAt" ASC, event."buildRunId" ASC, event."sequence" ASC`,
      storeId
    );
    return rows.map(toEvent);
  }
}

/** Cast helper for the generated Prisma client without coupling tests to it. */
export function createPrismaStoreFactoryV2Repository(
  prismaClient: unknown
): PrismaStoreFactoryV2Repository {
  return new PrismaStoreFactoryV2Repository(
    prismaClient as StoreFactoryV2PrismaClient
  );
}

async function lockedBuildRun(
  transaction: StoreFactoryV2PrismaTransaction,
  storeId: string,
  runId: string
): Promise<StoreBuildRunV2> {
  const rows = await transaction.$queryRawUnsafe<BuildRunRow[]>(
    `${buildRunProjection}
     WHERE run."id" = $1 AND run."storeId" = $2
     FOR UPDATE OF run`,
    runId,
    storeId
  );
  if (!rows[0]) throw invariant("Build run was not found for the requested store.");
  return toBuildRun(rows[0]);
}

async function lockActivePreviewStore(
  transaction: StoreFactoryV2PrismaTransaction,
  storeId: string
): Promise<void> {
  const rows = await transaction.$queryRawUnsafe<
    Array<{ id: string; launchStatus: string; isActive: boolean }>
  >(
    `SELECT "id", "launchStatus", "isActive"
     FROM "Store" WHERE "id" = $1 FOR UPDATE`,
    storeId
  );
  const store = rows[0];
  if (
    !store ||
    store.id !== storeId ||
    store.launchStatus !== "PREVIEW" ||
    store.isActive !== true
  ) {
    throw new StoreFactoryV2Error(
      "STORE_NOT_PREVIEW_ACTIVE",
      "Store Factory V2 writes require an active PREVIEW store at commit time."
    );
  }
}

async function buildRunPhase(
  transaction: StoreFactoryV2PrismaTransaction,
  storeId: string,
  buildRunId: string
): Promise<StoreBuildRunV2["phase"]> {
  const rows = await transaction.$queryRawUnsafe<Array<{ phase: string }>>(
    `SELECT "phase" FROM "StoreBuildRun"
     WHERE "id" = $1 AND "storeId" = $2`,
    buildRunId,
    storeId
  );
  if (!rows[0]) throw invariant("Event build run was not found for the store.");
  return BuildPhaseV1Schema.parse(rows[0].phase);
}

async function appendEvent(
  transaction: StoreFactoryV2PrismaTransaction,
  storeId: string,
  input: AppendEventV1Input
): Promise<void> {
  const locked = await transaction.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "StoreBuildRun"
     WHERE "id" = $1 AND "storeId" = $2 FOR UPDATE`,
    input.buildRunId,
    storeId
  );
  if (!locked[0]) throw invariant("Cannot append an event outside its store.");
  const sequenceRows = await transaction.$queryRawUnsafe<
    Array<{ sequence: number }>
  >(
    `SELECT COALESCE(MAX("sequence"), 0) + 1 AS "sequence"
     FROM "StoreBuildEvent" WHERE "buildRunId" = $1`,
    input.buildRunId
  );
  const sequence = Number(sequenceRows[0]?.sequence ?? 1);
  await transaction.$executeRawUnsafe(
    `INSERT INTO "StoreBuildEvent" (
       "id", "buildRunId", "sequence", "contractVersion", "phase",
       "eventType", "payloadJson", "createdAt"
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    deterministicStoreFactoryIdV1("sbe", input.buildRunId, sequence),
    input.buildRunId,
    sequence,
    STORE_BUILD_EVENT_V1,
    input.phase,
    input.type,
    canonicalJsonV1(input.payload ?? {}),
    toDate(input.createdAt, "event createdAt")
  );
}

function toBuildRun(row: BuildRunRow): StoreBuildRunV2 {
  if (row.contractVersion !== STORE_BUILD_RUN_V2) {
    throw invariant("Unsupported persisted build-run contract version.");
  }
  const brief = StoreBriefV1Schema.parse(parseJson(row.briefJson, "briefJson"));
  const catalogShape = CatalogShapeV1Schema.parse(
    parseJson(row.catalogShapeJson, "catalogShapeJson")
  );
  const request = StoreBuildRequestV2Schema.parse(
    parseJson(row.requestJson, "requestJson")
  );
  const binding = CatalogBindingV1Schema.parse(
    parseJson(row.catalogBindingJson, "catalogBindingJson")
  );
  if (
    request.storeId !== row.storeId ||
    request.requestedBy !== row.requestedBy ||
    storeBuildInputDigestV2(request) !== row.inputDigest ||
    deriveStoreBuildRequestKeyV2(request) !== row.requestKey ||
    request.catalogBinding.artifactId !== row.catalogArtifactId ||
    canonicalJsonV1(request.catalogBinding) !== canonicalJsonV1(binding) ||
    canonicalJsonV1(request.brief) !== canonicalJsonV1(brief) ||
    canonicalJsonV1(request.catalogShape) !== canonicalJsonV1(catalogShape)
  ) {
    throw invariant("Persisted build request columns do not match requestJson.");
  }
  assertOptionalDigest(row.outputDigest, "build-run outputDigest");
  const state = BuildRunStateV1Schema.parse(row.status);
  if ((state === "SUCCEEDED") !== (row.outputDigest !== null)) {
    throw invariant(
      "Persisted build-run output digest does not match terminal state."
    );
  }
  if (
    state === "SUCCEEDED" &&
    (!row.revisionId || row.revisionOutputDigest !== row.outputDigest)
  ) {
    throw invariant(
      "Persisted successful build-run digest does not match its revision."
    );
  }
  return {
    contractVersion: STORE_BUILD_RUN_V2,
    id: row.id,
    storeId: row.storeId,
    requestKey: row.requestKey,
    inputDigest: row.inputDigest,
    outputDigest: row.outputDigest,
    requestedBy: row.requestedBy,
    requestJson: canonicalJsonV1(request),
    briefJson: canonicalJsonV1(brief),
    catalogShapeJson: canonicalJsonV1(catalogShape),
    catalogArtifactId: row.catalogArtifactId,
    catalogBindingJson: canonicalJsonV1(binding),
    state,
    phase: BuildPhaseV1Schema.parse(row.phase),
    revisionId: row.revisionId,
    failureCode: row.failureCode,
    failureMessage: row.failureMessage,
    startedAt: toIso(row.startedAt, "startedAt"),
    completedAt: row.completedAt ? toIso(row.completedAt, "completedAt") : null,
  };
}

function toRevision(row: RevisionRow): StoreRevisionV2 {
  if (row.contractVersion !== STORE_REVISION_V2) {
    throw invariant("Unsupported persisted revision contract version.");
  }
  assertDigest(row.outputDigest, "revision outputDigest");
  const document = StoreRevisionDocumentV2Schema.parse(
    parseJson(row.revisionJson, "revisionJson")
  );
  if (
    document.outputDigest !== row.outputDigest ||
    document.inputDigest !== row.inputDigest ||
    document.catalogBinding.artifactId !== row.catalogArtifactId ||
    canonicalJsonV1(document.catalogBinding) !== row.catalogBindingJson
  ) {
    throw invariant("Persisted revision digests do not match revisionJson.");
  }
  return {
    contractVersion: STORE_REVISION_V2,
    id: row.id,
    storeId: row.storeId,
    buildRunId: row.buildRunId,
    revisionNumber: row.revisionNumber,
    parentRevisionId: row.parentRevisionId,
    catalogArtifactId: row.catalogArtifactId,
    catalogBinding: CatalogBindingV1Schema.parse(
      parseJson(row.catalogBindingJson, "catalogBindingJson")
    ),
    inputDigest: row.inputDigest,
    outputDigest: row.outputDigest,
    status: RevisionStatusV1Schema.parse(row.status),
    document,
    createdAt: toIso(row.createdAt, "createdAt"),
    reviewedAt: row.reviewedAt ? toIso(row.reviewedAt, "reviewedAt") : null,
    reviewedBy: row.reviewedBy,
    reviewReason: row.reviewReason,
  };
}

function toEvent(row: EventRow): StoreBuildEventV1 {
  if (row.contractVersion !== STORE_BUILD_EVENT_V1) {
    throw invariant("Unsupported persisted build-event contract version.");
  }
  const payload = parseJson(row.payloadJson, "payloadJson");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw invariant("Build-event payload must be an object.");
  }
  return {
    contractVersion: STORE_BUILD_EVENT_V1,
    id: row.id,
    buildRunId: row.buildRunId,
    sequence: row.sequence,
    phase: BuildPhaseV1Schema.parse(row.phase),
    type: StoreBuildEventTypeV1Schema.parse(row.eventType),
    payload: payload as Record<string, unknown>,
    createdAt: toIso(row.createdAt, "createdAt"),
  };
}

function toPointer(row: PointerRow): PreviewRevisionPointerV1 {
  if (row.contractVersion !== PREVIEW_REVISION_POINTER_V1) {
    throw invariant("Unsupported persisted preview-pointer contract version.");
  }
  if (!Number.isInteger(row.version) || row.version < 0) {
    throw invariant("Invalid preview-pointer version.");
  }
  if (!(["NONE", "PROMOTE", "ROLLBACK"] as const).includes(row.lastAction as never)) {
    throw invariant("Invalid preview-pointer action.");
  }
  return {
    contractVersion: PREVIEW_REVISION_POINTER_V1,
    storeId: row.storeId,
    activeRevisionId: row.activePreviewRevisionId,
    version: row.version,
    lastAction: row.lastAction as PreviewRevisionPointerV1["lastAction"],
    changedBy: row.changedBy,
    changeReason: row.changeReason,
    updatedAt: toIso(row.updatedAt, "updatedAt"),
  };
}

function emptyPointer(storeId: string): PreviewRevisionPointerV1 {
  return {
    contractVersion: PREVIEW_REVISION_POINTER_V1,
    storeId,
    activeRevisionId: null,
    version: 0,
    lastAction: "NONE",
    changedBy: null,
    changeReason: null,
    updatedAt: null,
  };
}

function assertInitialRun(run: StoreBuildRunV2): void {
  if (
    run.contractVersion !== STORE_BUILD_RUN_V2 ||
    run.state !== "RUNNING" ||
    run.phase !== "RECEIVED" ||
    run.outputDigest !== null ||
    run.revisionId !== null ||
    run.completedAt !== null ||
    run.failureCode !== null ||
    run.failureMessage !== null
  ) {
    throw invariant("Build-run claim must contain pristine RECEIVED state.");
  }
  StoreBriefV1Schema.parse(parseJson(run.briefJson, "briefJson"));
  CatalogShapeV1Schema.parse(
    parseJson(run.catalogShapeJson, "catalogShapeJson")
  );
  const request = StoreBuildRequestV2Schema.parse(
    parseJson(run.requestJson, "requestJson")
  );
  const binding = CatalogBindingV1Schema.parse(
    parseJson(run.catalogBindingJson, "catalogBindingJson")
  );
  if (
    request.storeId !== run.storeId ||
    request.requestedBy !== run.requestedBy ||
    storeBuildInputDigestV2(request) !== run.inputDigest ||
    deriveStoreBuildRequestKeyV2(request) !== run.requestKey ||
    binding.artifactId !== run.catalogArtifactId ||
    canonicalJsonV1(request.catalogBinding) !== canonicalJsonV1(binding)
  ) {
    throw invariant("Build-run catalog binding is inconsistent.");
  }
  toDate(run.startedAt, "startedAt");
}

function replayResult(
  existing: StoreBuildRunV2,
  inputDigest: string
): ClaimBuildRunV1Result {
  if (existing.inputDigest !== inputDigest) {
    throw new StoreFactoryV2Error(
      "BUILD_IDEMPOTENCY_CONFLICT",
      "The request key was already used for different build input."
    );
  }
  return { created: false, run: existing };
}

function requireOne<T>(rows: T[], message: string): T {
  const row = rows[0];
  if (!row) throw invariant(message);
  return row;
}

function parseJson(value: string, field: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw invariant(`Persisted ${field} is malformed JSON.`);
  }
}

function toDate(value: string, field: string): Date {
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) throw invariant(`Invalid ${field}.`);
  return result;
}

function toIso(value: Date | string, field: string): string {
  const result = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(result.getTime())) throw invariant(`Invalid ${field}.`);
  return result.toISOString();
}

function isUniqueConstraint(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    meta?: { code?: unknown; database_error_code?: unknown };
  };
  return (
    candidate.code === "P2002" ||
    candidate.code === "23505" ||
    candidate.meta?.code === "23505" ||
    candidate.meta?.database_error_code === "23505" ||
    (typeof candidate.message === "string" &&
      /unique constraint|duplicate key/i.test(candidate.message))
  );
}

function normalizePersistenceError(error: unknown): Error {
  return error instanceof StoreFactoryV2Error
    ? error
    : invariant(
        error instanceof Error
          ? `Store Factory persistence failed: ${error.message}`
          : "Store Factory persistence failed."
      );
}

function invariant(message: string): StoreFactoryV2Error {
  return new StoreFactoryV2Error(
    "REPOSITORY_INVARIANT_VIOLATION",
    message.replace(/[\r\n\t]+/g, " ").slice(0, 2_000)
  );
}

function assertDigest(value: string, field: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) {
    throw invariant(`Persisted ${field} is invalid.`);
  }
}

function assertOptionalDigest(value: string | null, field: string): void {
  if (value !== null) assertDigest(value, field);
}
