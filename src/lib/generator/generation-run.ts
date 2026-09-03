import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/utils/json";

export const GENERATION_RUN_CONTRACT_VERSION = "generation-run.v1";
export const GENERATOR_VERSION = "generator.v3";

export type GeneratorTerminalStatus =
  | "READY_FOR_PREVIEW"
  | "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW"
  | "POLICY_BLOCKED"
  | "INSUFFICIENT_RELEVANT_PRODUCTS"
  | "INSUFFICIENT_INTENT_EVIDENCE"
  | "PROVIDER_FAILED"
  | "VALIDATION_FAILED"
  | "CANCELLED";

export interface GenerationRunPhase {
  phase: string;
  status: "RUNNING" | "PASS" | "FAIL" | "REVIEW";
  at: string;
  detail?: string;
}

export interface GenerationRunSummary {
  contractVersion: typeof GENERATION_RUN_CONTRACT_VERSION;
  generatorVersion: typeof GENERATOR_VERSION;
  idempotencyKey: string;
  /** Digest of the exact approved plan plus runtime options for replay safety. */
  requestFingerprint?: string;
  originalInput: unknown;
  normalizedInput?: unknown;
  intent?: unknown;
  policy?: unknown;
  queryAttempts?: unknown[];
  /** Immutable, versioned shortlist evidence captured during this run. */
  catalogSelections?: unknown[];
  counts?: Record<string, number>;
  reasonCodes?: string[];
  phases: GenerationRunPhase[];
  result?: unknown;
}

export interface BeginGenerationRunResult {
  runId: string;
  isExisting: boolean;
  status: string;
  storeId: string | null;
  summary: GenerationRunSummary;
}

type GenerationRunDb = Pick<PrismaClient, "catalogSyncRun">;

function safeJsonValue(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { unparseable: true };
  }
}

export function normalizeGenerationIdempotencyKey(value?: string): string {
  const raw = value?.trim() || randomUUID();
  const candidate = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (candidate.startsWith("genv3-")) return candidate;
  return `genv3-${candidate || randomUUID()}`;
}

export function parseGenerationRunSummary(raw: string): GenerationRunSummary | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GenerationRunSummary>;
    if (
      parsed.contractVersion !== GENERATION_RUN_CONTRACT_VERSION ||
      parsed.generatorVersion !== GENERATOR_VERSION ||
      typeof parsed.idempotencyKey !== "string" ||
      !Array.isArray(parsed.phases)
    ) {
      return null;
    }
    return parsed as GenerationRunSummary;
  } catch {
    return null;
  }
}

export function isTerminalGenerationStatus(status: string): status is GeneratorTerminalStatus {
  return [
    "READY_FOR_PREVIEW",
    "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW",
    "POLICY_BLOCKED",
    "INSUFFICIENT_RELEVANT_PRODUCTS",
    "INSUFFICIENT_INTENT_EVIDENCE",
    "PROVIDER_FAILED",
    "VALIDATION_FAILED",
    "CANCELLED",
  ].includes(status);
}

export async function beginGenerationRun(input: {
  idempotencyKey?: string;
  originalInput: unknown;
  requestFingerprint?: string;
}): Promise<BeginGenerationRunResult> {
  const runId = normalizeGenerationIdempotencyKey(input.idempotencyKey);
  const initialSummary: GenerationRunSummary = {
    contractVersion: GENERATION_RUN_CONTRACT_VERSION,
    generatorVersion: GENERATOR_VERSION,
    idempotencyKey: runId,
    ...(input.requestFingerprint
      ? { requestFingerprint: input.requestFingerprint }
      : {}),
    originalInput: safeJsonValue(input.originalInput),
    phases: [
      {
        phase: "VALIDATE_INPUT",
        status: "RUNNING",
        at: new Date().toISOString(),
      },
    ],
  };

  try {
    const run = await prisma.catalogSyncRun.create({
      data: {
        id: runId,
        status: "RUNNING",
        requestedBy: "admin-generator-v3",
        summaryJson: toJson(initialSummary),
      },
    });
    return {
      runId: run.id,
      isExisting: false,
      status: run.status,
      storeId: run.storeId,
      summary: initialSummary,
    };
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
  }

  const existing = await prisma.catalogSyncRun.findUnique({ where: { id: runId } });
  if (!existing || existing.requestedBy !== "admin-generator-v3") {
    throw new Error("Generation idempotency key collided with a non-generator run.");
  }
  const summary = parseGenerationRunSummary(existing.summaryJson);
  if (!summary) throw new Error("Existing generator run has an invalid audit record.");
  if (
    input.requestFingerprint &&
    summary.requestFingerprint !== input.requestFingerprint
  ) {
    throw new Error(
      "Generation idempotency key was already used for a different approved plan or runtime configuration."
    );
  }
  return {
    runId: existing.id,
    isExisting: true,
    status: existing.status,
    storeId: existing.storeId,
    summary,
  };
}

export async function updateGenerationRun(
  runId: string,
  update: Partial<Omit<GenerationRunSummary, "contractVersion" | "generatorVersion" | "idempotencyKey">> & {
    phase?: GenerationRunPhase;
    storeId?: string;
  }
): Promise<GenerationRunSummary> {
  const run = await prisma.catalogSyncRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error(`Unknown generation run: ${runId}`);
  const current = parseGenerationRunSummary(run.summaryJson);
  if (!current) throw new Error(`Invalid generation run record: ${runId}`);

  const next: GenerationRunSummary = {
    ...current,
    ...(update.normalizedInput !== undefined
      ? { normalizedInput: safeJsonValue(update.normalizedInput) }
      : {}),
    ...(update.intent !== undefined ? { intent: safeJsonValue(update.intent) } : {}),
    ...(update.policy !== undefined ? { policy: safeJsonValue(update.policy) } : {}),
    ...(update.queryAttempts !== undefined
      ? { queryAttempts: safeJsonValue(update.queryAttempts) as unknown[] }
      : {}),
    ...(update.catalogSelections !== undefined
      ? {
          catalogSelections: safeJsonValue(
            update.catalogSelections
          ) as unknown[],
        }
      : {}),
    ...(update.counts !== undefined ? { counts: update.counts } : {}),
    ...(update.reasonCodes !== undefined ? { reasonCodes: update.reasonCodes } : {}),
    ...(update.result !== undefined ? { result: safeJsonValue(update.result) } : {}),
    phases: update.phase ? [...current.phases, update.phase] : current.phases,
  };

  await prisma.catalogSyncRun.update({
    where: { id: runId },
    data: {
      ...(update.storeId ? { storeId: update.storeId } : {}),
      summaryJson: toJson(next),
    },
  });
  return next;
}

export async function completeGenerationRun(input: {
  runId: string;
  status: GeneratorTerminalStatus;
  result: unknown;
  errorMessage?: string;
  reasonCodes?: string[];
}, db: GenerationRunDb = prisma): Promise<void> {
  const run = await db.catalogSyncRun.findUnique({ where: { id: input.runId } });
  if (!run) throw new Error(`Unknown generation run: ${input.runId}`);
  const current = parseGenerationRunSummary(run.summaryJson);
  if (!current) throw new Error(`Invalid generation run record: ${input.runId}`);
  const now = new Date();
  const summary: GenerationRunSummary = {
    ...current,
    ...(input.reasonCodes ? { reasonCodes: input.reasonCodes } : {}),
    result: safeJsonValue(input.result),
    phases: [
      ...current.phases,
      {
        phase: "TERMINAL",
        status:
          input.status === "READY_FOR_PREVIEW"
            ? "PASS"
            : input.status === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW"
              ? "REVIEW"
              : "FAIL",
        at: now.toISOString(),
        detail: input.status,
      },
    ],
  };

  await db.catalogSyncRun.update({
    where: { id: input.runId },
    data: {
      status: input.status,
      finishedAt: now,
      summaryJson: toJson(summary),
      errorMessage: input.errorMessage ?? null,
    },
  });
}
