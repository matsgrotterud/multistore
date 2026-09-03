import { createHash } from "node:crypto";
import { z } from "zod";
import {
  StoreExperienceCatalogProjectionV2Schema,
  type StoreExperienceCatalogProjectionV2,
} from "@/lib/storefront-v2/catalog-context";
import {
  STORE_EXPERIENCE_MANIFEST_V2,
  storeExperienceManifestV2Schema,
  type StoreExperienceManifestV2,
} from "@/lib/storefront-v2/manifest";
import {
  validateStoreExperienceManifestV2,
  type StoreExperienceValidationResultV2,
} from "@/lib/storefront-v2/validation";

export const MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_ID =
  "multistore.store-experience-proposal.v1" as const;
export const MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_VERSION =
  "1.0.0" as const;
export const STORE_EXPERIENCE_PROMPT_VERSION =
  "store-experience-prompt.v1" as const;
export const STORE_EXPERIENCE_PROPOSAL_ATTEMPT_VERSION =
  "store-experience-proposal-attempt.v1" as const;

export const storeExperienceBriefV1Schema = z
  .object({
    brandName: z.string().trim().min(1).max(100),
    niche: z.string().trim().min(1).max(160),
    audience: z.string().trim().min(1).max(500),
    positioning: z.enum(["budget", "value", "premium", "mixed"]),
    voice: z.enum(["direct", "editorial", "expert", "playful", "calm"]),
    objective: z
      .enum(["discover", "compare", "educate", "repeat-purchase"]),
  })
  .strict();

export type StoreExperienceBriefV1 = z.infer<
  typeof storeExperienceBriefV1Schema
>;

export interface StoreExperienceProposalRequestV1 {
  capabilityId: typeof MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_ID;
  capabilityVersion: typeof MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_VERSION;
  promptVersion: typeof STORE_EXPERIENCE_PROMPT_VERSION;
  tenantId: string;
  storeId: string;
  idempotencyKey: string;
  inputDigest: string;
  brief: StoreExperienceBriefV1;
  /** A storefront-safe projection. Supplier and internal commerce fields are absent. */
  catalog: StoreExperienceCatalogProjectionV2;
  outputContract: typeof STORE_EXPERIENCE_MANIFEST_V2;
  outputDisposition: "proposal_only";
}

export interface StoreExperienceProposalUsageV1 {
  inputTokens: number | null;
  outputTokens: number | null;
  /** Integer millionths of USD. Unknown cost remains null. */
  costMicroUsd: number | null;
}

export interface StoreExperienceProposalProviderResultV1 {
  provider: string;
  model: string;
  promptVersion: string;
  providerResponseId: string | null;
  output: unknown;
  usage: StoreExperienceProposalUsageV1;
}

const storeExperienceProposalProviderEnvelopeV1Schema = z
  .object({
    provider: z.string().trim().min(1).max(120),
    model: z.string().trim().min(1).max(240),
    promptVersion: z.string().trim().min(1).max(120),
    providerResponseId: z.string().trim().min(1).max(300).nullable(),
    output: z.unknown(),
    usage: z
      .object({
        inputTokens: z.unknown(),
        outputTokens: z.unknown(),
        costMicroUsd: z.unknown(),
      })
      .strict(),
  })
  .strict()
  .refine((value) => Object.prototype.hasOwnProperty.call(value, "output"), {
    path: ["output"],
    message: "Provider result must include output.",
  });

export type StoreExperienceProposalFailureCodeV1 =
  | "PROVIDER_FAILED"
  | "PROVIDER_TIMEOUT"
  | "MALFORMED_OUTPUT"
  | "VALIDATION_FAILED"
  | "PROVENANCE_MISMATCH";

interface StoreExperienceProposalAttemptBaseV1 {
  version: typeof STORE_EXPERIENCE_PROPOSAL_ATTEMPT_VERSION;
  capabilityId: typeof MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_ID;
  capabilityVersion: typeof MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_VERSION;
  promptVersion: typeof STORE_EXPERIENCE_PROMPT_VERSION;
  tenantId: string;
  storeId: string;
  idempotencyKey: string;
  inputDigest: string;
  disposition: "PROPOSAL_ONLY";
  fallback: "DETERMINISTIC_DEFAULT_AVAILABLE";
  provider: string | null;
  model: string | null;
  providerResponseId: string | null;
  outputDigest: string | null;
  usage: StoreExperienceProposalUsageV1;
}

export type StoreExperienceProposalAttemptV1 =
  | (StoreExperienceProposalAttemptBaseV1 & {
      status: "PROPOSED";
      failureCode: null;
      failureMessage: null;
      manifest: StoreExperienceManifestV2;
      validation: Extract<StoreExperienceValidationResultV2, { success: true }>;
    })
  | (StoreExperienceProposalAttemptBaseV1 & {
      status: "REJECTED" | "INDETERMINATE";
      failureCode: StoreExperienceProposalFailureCodeV1;
      failureMessage: string;
      manifest: null;
      validation: StoreExperienceValidationResultV2 | null;
    });

export interface StoreExperienceProposalAdapterV1 {
  propose(input: {
    request: Readonly<StoreExperienceProposalRequestV1>;
    signal: AbortSignal;
  }): Promise<StoreExperienceProposalProviderResultV1>;
}

export function createStoreExperienceProposalRequestV1(input: {
  tenantId: string;
  storeId: string;
  idempotencyKey: string;
  brief: StoreExperienceBriefV1;
  catalog: StoreExperienceCatalogProjectionV2;
}): StoreExperienceProposalRequestV1 {
  const tenantId = boundedIdentifier(input.tenantId, "tenantId");
  const storeId = boundedIdentifier(input.storeId, "storeId");
  const idempotencyKey = boundedIdentifier(
    input.idempotencyKey,
    "idempotencyKey",
    8,
    160
  );
  const brief = storeExperienceBriefV1Schema.parse(input.brief);
  const catalog = StoreExperienceCatalogProjectionV2Schema.parse(input.catalog);
  const digestInput = {
    capabilityId: MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_ID,
    capabilityVersion: MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_VERSION,
    promptVersion: STORE_EXPERIENCE_PROMPT_VERSION,
    tenantId,
    storeId,
    brief,
    catalog,
    outputContract: STORE_EXPERIENCE_MANIFEST_V2,
    outputDisposition: "proposal_only" as const,
  };
  return {
    ...digestInput,
    idempotencyKey,
    inputDigest: canonicalSha256V1(digestInput),
  };
}

/**
 * Runs one proposal attempt without retries. A timeout or ambiguous transport
 * result is retained as INDETERMINATE under the same idempotency key. No store
 * revision or other domain mutation is performed by this capability boundary.
 */
export async function runStoreExperienceProposalV1(input: {
  request: StoreExperienceProposalRequestV1;
  adapter: StoreExperienceProposalAdapterV1;
  timeoutMs?: number;
}): Promise<StoreExperienceProposalAttemptV1> {
  const request = assertStoreExperienceProposalRequestV1(input.request);
  const timeoutMs = Math.max(250, Math.min(input.timeoutMs ?? 20_000, 60_000));
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let providerEnvelope: unknown;

  try {
    providerEnvelope = await Promise.race([
      input.adapter.propose({
        request: Object.freeze(request),
        signal: controller.signal,
      }),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new StoreExperienceProposalTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    const timedOut = error instanceof StoreExperienceProposalTimeoutError;
    return rejectedAttempt(request, {
      status: timedOut ? "INDETERMINATE" : "REJECTED",
      failureCode: timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_FAILED",
      failureMessage: timedOut
        ? "Experience proposal timed out; reconcile with the same idempotency key."
        : safeMessage(error, "Experience proposal provider failed."),
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const providerEnvelopeResult =
    storeExperienceProposalProviderEnvelopeV1Schema.safeParse(providerEnvelope);
  if (!providerEnvelopeResult.success) {
    return rejectedAttempt(request, {
      failureCode: "MALFORMED_OUTPUT",
      failureMessage: "Provider result envelope did not match the capability contract.",
    });
  }
  const providerResult: StoreExperienceProposalProviderResultV1 = {
    ...providerEnvelopeResult.data,
    output: providerEnvelopeResult.data.output,
    usage: normalizeUsage(providerEnvelopeResult.data.usage),
  };

  if (providerResult.promptVersion !== request.promptVersion) {
    return rejectedAttempt(request, {
      failureCode: "PROVENANCE_MISMATCH",
      failureMessage: "Provider prompt version did not match the requested contract.",
      providerResult,
    });
  }

  const parsed = storeExperienceManifestV2Schema.safeParse(providerResult.output);
  if (!parsed.success) {
    return rejectedAttempt(request, {
      failureCode: "MALFORMED_OUTPUT",
      failureMessage: "Provider output did not match StoreExperienceManifestV2.",
      providerResult,
    });
  }

  const validation = validateStoreExperienceManifestV2(
    parsed.data,
    request.catalog
  );
  const outputDigest = canonicalSha256V1(parsed.data);
  if (!validation.success) {
    return rejectedAttempt(request, {
      failureCode: "VALIDATION_FAILED",
      failureMessage: `Experience proposal failed ${validation.issues.length} deterministic validation check(s).`,
      providerResult,
      outputDigest,
      validation,
    });
  }

  return {
    ...attemptBase(request, providerResult, outputDigest),
    status: "PROPOSED",
    failureCode: null,
    failureMessage: null,
    manifest: validation.manifest,
    validation,
  };
}

/**
 * Re-validates the complete request immediately before the adapter boundary.
 * Callers cannot mutate a previously-created request while retaining its old
 * digest, capability version or output disposition.
 */
export function assertStoreExperienceProposalRequestV1(
  request: StoreExperienceProposalRequestV1
): StoreExperienceProposalRequestV1 {
  const normalized = createStoreExperienceProposalRequestV1({
    tenantId: request.tenantId,
    storeId: request.storeId,
    idempotencyKey: request.idempotencyKey,
    brief: request.brief,
    catalog: request.catalog,
  });
  if (
    request.capabilityId !== normalized.capabilityId ||
    request.capabilityVersion !== normalized.capabilityVersion ||
    request.promptVersion !== normalized.promptVersion ||
    request.outputContract !== normalized.outputContract ||
    request.outputDisposition !== normalized.outputDisposition ||
    request.inputDigest !== normalized.inputDigest ||
    request.tenantId !== normalized.tenantId ||
    request.storeId !== normalized.storeId ||
    request.idempotencyKey !== normalized.idempotencyKey
  ) {
    throw new Error("Experience proposal request integrity check failed.");
  }
  return normalized;
}

class StoreExperienceProposalTimeoutError extends Error {
  constructor() {
    super("STORE_EXPERIENCE_PROPOSAL_TIMEOUT");
    this.name = "StoreExperienceProposalTimeoutError";
  }
}

export function canonicalSha256V1(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Digest input must be finite JSON.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  throw new Error("Digest input must be JSON serializable.");
}

function rejectedAttempt(
  request: StoreExperienceProposalRequestV1,
  input: {
    status?: "REJECTED" | "INDETERMINATE";
    failureCode: StoreExperienceProposalFailureCodeV1;
    failureMessage: string;
    providerResult?: StoreExperienceProposalProviderResultV1;
    outputDigest?: string;
    validation?: StoreExperienceValidationResultV2;
  }
): StoreExperienceProposalAttemptV1 {
  return {
    ...attemptBase(request, input.providerResult, input.outputDigest ?? null),
    status: input.status ?? "REJECTED",
    failureCode: input.failureCode,
    failureMessage: input.failureMessage.slice(0, 1_000),
    manifest: null,
    validation: input.validation ?? null,
  };
}

function attemptBase(
  request: StoreExperienceProposalRequestV1,
  providerResult?: StoreExperienceProposalProviderResultV1,
  outputDigest: string | null = null
): StoreExperienceProposalAttemptBaseV1 {
  return {
    version: STORE_EXPERIENCE_PROPOSAL_ATTEMPT_VERSION,
    capabilityId: MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_ID,
    capabilityVersion: MULTISTORE_EXPERIENCE_PROPOSAL_CAPABILITY_VERSION,
    promptVersion: STORE_EXPERIENCE_PROMPT_VERSION,
    tenantId: request.tenantId,
    storeId: request.storeId,
    idempotencyKey: request.idempotencyKey,
    inputDigest: request.inputDigest,
    disposition: "PROPOSAL_ONLY",
    fallback: "DETERMINISTIC_DEFAULT_AVAILABLE",
    provider: providerResult?.provider ?? null,
    model: providerResult?.model ?? null,
    providerResponseId: providerResult?.providerResponseId ?? null,
    outputDigest,
    usage: normalizeUsage(providerResult?.usage),
  };
}

function normalizeUsage(
  usage:
    | StoreExperienceProposalUsageV1
    | {
        inputTokens?: unknown;
        outputTokens?: unknown;
        costMicroUsd?: unknown;
      }
    | undefined
): StoreExperienceProposalUsageV1 {
  return {
    inputTokens: nullableNonnegativeInteger(usage?.inputTokens),
    outputTokens: nullableNonnegativeInteger(usage?.outputTokens),
    costMicroUsd: nullableNonnegativeInteger(usage?.costMicroUsd),
  };
}

function nullableNonnegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function boundedIdentifier(
  value: string,
  label: string,
  min = 1,
  max = 128
): string {
  const normalized = value.trim();
  if (
    normalized.length < min ||
    normalized.length > max ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)
  ) {
    throw new Error(`${label} has an invalid shape.`);
  }
  return normalized;
}

function safeMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  return message.replace(/[\r\n\t]+/g, " ").trim().slice(0, 1_000) || fallback;
}
