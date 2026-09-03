import { z } from "zod";
import type { PricePositioning } from "./types";

export const MULTISTORE_CATALOG_SELECTION_CAPABILITY_ID =
  "multistore.catalog-product-selection.v1" as const;
export const MULTISTORE_CATALOG_SELECTION_CAPABILITY_VERSION = "1.0.0" as const;
export const CATALOG_SELECTION_ADVICE_INPUT_VERSION =
  "catalog-selection-advice-input.v1" as const;
export const CATALOG_SELECTION_ADVICE_OUTPUT_VERSION =
  "catalog-selection-advice-output.v1" as const;

const recommendedActionSchema = z.enum([
  "poll",
  "retry_same_key",
  "retry_new_key",
  "do_not_retry",
]);

const catalogSelectionAdviceInputSchema = z
  .object({
    version: z.literal(CATALOG_SELECTION_ADVICE_INPUT_VERSION),
    productClass: z.string().min(3).max(160),
    pricePositioning: z.enum(["budget", "value", "premium", "mixed"]),
    requestedCount: z.number().int().min(1).max(12),
    candidates: z
      .array(
        z
          .object({
            candidateId: z.string().min(1).max(160),
            title: z.string().min(1).max(500),
            supplierUnitCost: z.number().positive(),
            currency: z.string().regex(/^[A-Z]{3}$/),
            shippingCost: z.number().nonnegative(),
            shippingDaysMax: z.number().int().positive(),
            stockStatus: z.enum(["IN_STOCK", "LOW_STOCK"]),
            supplierScore: z.number().min(0).max(100),
            mediaCount: z.number().int().min(2).max(100),
            manualReviewTerms: z.array(z.string().min(1).max(80)).max(20),
            // The shared engine is advisory and receives only candidates that
            // already passed Multistore's deterministic authority boundary.
            hardGatesPassed: z.literal(true),
          })
          .strict()
      )
      .min(1)
      .max(64),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.candidates.map((candidate) => candidate.candidateId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Candidate IDs must be unique.",
        path: ["candidates"],
      });
    }
  });

const catalogSelectionAdviceOutputSchema = z
  .object({
    version: z.literal(CATALOG_SELECTION_ADVICE_OUTPUT_VERSION),
    assessments: z
      .array(
        z
          .object({
            candidateId: z.string().min(1).max(160),
            semanticFit: z.number().min(0).max(1),
            valueFit: z.number().min(0).max(1),
            merchandisingRole: z.string().min(1).max(120),
            reasonCodes: z.array(z.string().min(1).max(120)).max(20),
          })
          .strict()
      )
      .max(64),
  })
  .strict();

const engineMetaSchema = z
  .object({
    productId: z.literal("multistore"),
    tenantId: z.string().min(1),
    provider: z.string().min(1),
    model: z.string().min(1),
    providerResponseId: z.string().nullable(),
    releaseId: z.string().min(1),
    releaseHash: z.string().min(1),
    modelPolicyVersion: z.string().min(1),
  })
  .passthrough();

const engineResourceSchema = z
  .object({
    ok: z.literal(true),
    runId: z.string().regex(/^eng_/),
    capability: z.object({
      id: z.literal(MULTISTORE_CATALOG_SELECTION_CAPABILITY_ID),
      version: z.literal(MULTISTORE_CATALOG_SELECTION_CAPABILITY_VERSION),
    }),
    status: z.enum([
      "accepted",
      "running",
      "succeeded",
      "failed",
      "indeterminate",
    ]),
    approval: z.object({
      mode: z.enum(["none", "human_before_tool"]),
      state: z.enum(["not_required", "required"]),
      outputDisposition: z.enum(["proposal_only", "read_only_result"]),
    }),
    meta: engineMetaSchema,
    resultAvailability: z.enum(["available", "unavailable"]).optional(),
    result: z.unknown().optional(),
    error: z
      .object({ code: z.string(), message: z.string() })
      .optional(),
    recommendedAction: recommendedActionSchema,
  })
  .passthrough();

const engineErrorSchema = z
  .object({
    ok: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
      recommendedAction: recommendedActionSchema,
      runId: z.string().optional(),
    }),
  })
  .passthrough();

export type CatalogSelectionAdviceInput = z.infer<
  typeof catalogSelectionAdviceInputSchema
>;
export type CatalogSelectionAdviceOutput = z.infer<
  typeof catalogSelectionAdviceOutputSchema
>;

export type CatalogSelectionAdviceRun =
  | {
      status: "SUCCEEDED";
      runId: string;
      advice: CatalogSelectionAdviceOutput;
      provenance: z.infer<typeof engineMetaSchema>;
    }
  | {
      status: "PENDING";
      runId: string;
      recommendedAction: "poll";
    };

export class CatalogSelectionEngineError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly recommendedAction:
      | "poll"
      | "retry_same_key"
      | "retry_new_key"
      | "do_not_retry",
    readonly runId?: string
  ) {
    super(message);
    this.name = "CatalogSelectionEngineError";
  }
}

interface RunCatalogSelectionAdviceOptions {
  baseUrl: string;
  serviceToken: string;
  tenantId: string;
  idempotencyKey: string;
  input: CatalogSelectionAdviceInput;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Server-only transport for a future active AI Hub Multistore capability.
 *
 * The output is a proposal and must never bypass CatalogSelectionV1 hard gates
 * or perform a database mutation. There is deliberately no mock fallback and
 * no automatic retry: ambiguous failures retain the same idempotency key.
 */
export async function runCatalogSelectionAdvice(
  options: RunCatalogSelectionAdviceOptions
): Promise<CatalogSelectionAdviceRun> {
  const input = catalogSelectionAdviceInputSchema.parse(options.input);
  const endpoint = engineEndpoint(options.baseUrl);
  validateCredential(options.serviceToken);
  const tenantId = boundedText(options.tenantId, "tenantId", 1, 128);
  const idempotencyKey = boundedText(
    options.idempotencyKey,
    "idempotencyKey",
    8,
    128
  );
  const timeoutMs = Math.max(250, Math.min(options.timeoutMs ?? 15_000, 30_000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await (options.fetchFn ?? fetch)(endpoint, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${options.serviceToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        capabilityId: MULTISTORE_CATALOG_SELECTION_CAPABILITY_ID,
        capabilityVersion: MULTISTORE_CATALOG_SELECTION_CAPABILITY_VERSION,
        tenantId,
        input,
        idempotencyKey,
      }),
    });
  } catch (error) {
    clearTimeout(timeout);
    throw new CatalogSelectionEngineError(
      error instanceof Error && error.name === "AbortError"
        ? "AI Hub catalog-selection request timed out; reconcile with the same idempotency key."
        : "AI Hub catalog-selection outcome is unknown; reconcile with the same idempotency key.",
      "engine_outcome_indeterminate",
      "retry_same_key"
    );
  }

  let raw: unknown;
  try {
    // Keep the same deadline alive while consuming the body. A server that
    // sends headers and then stalls must not escape the transport timeout.
    raw = await boundedJson(response);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new CatalogSelectionEngineError(
        "AI Hub catalog-selection response timed out; reconcile with the same idempotency key.",
        "engine_outcome_indeterminate",
        "retry_same_key"
      );
    }
    if (!(error instanceof CatalogSelectionEngineError)) {
      throw new CatalogSelectionEngineError(
        "AI Hub catalog-selection response was interrupted; reconcile with the same idempotency key.",
        "engine_outcome_indeterminate",
        "retry_same_key"
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const parsed = engineErrorSchema.safeParse(raw);
    if (!parsed.success) {
      throw new CatalogSelectionEngineError(
        `AI Hub returned invalid error data (HTTP ${response.status}).`,
        "invalid_engine_error",
        "do_not_retry"
      );
    }
    throw new CatalogSelectionEngineError(
      parsed.data.error.message,
      parsed.data.error.code,
      parsed.data.error.recommendedAction,
      parsed.data.error.runId
    );
  }

  const resource = engineResourceSchema.parse(raw);
  if (resource.meta.tenantId !== tenantId) {
    throw new CatalogSelectionEngineError(
      "AI Hub catalog-selection provenance did not match the requested tenant.",
      "engine_tenant_scope_violation",
      "do_not_retry",
      resource.runId
    );
  }
  if (resource.approval.outputDisposition !== "proposal_only") {
    throw new CatalogSelectionEngineError(
      "AI Hub catalog-selection output must be proposal-only.",
      "invalid_output_disposition",
      "do_not_retry",
      resource.runId
    );
  }
  if (resource.status === "accepted" || resource.status === "running") {
    if (resource.recommendedAction !== "poll") {
      throw new CatalogSelectionEngineError(
        "AI Hub returned an invalid action for an in-progress run.",
        "invalid_pending_action",
        "do_not_retry",
        resource.runId
      );
    }
    return { status: "PENDING", runId: resource.runId, recommendedAction: "poll" };
  }
  if (resource.status !== "succeeded") {
    throw new CatalogSelectionEngineError(
      resource.error?.message ?? `AI Hub run ended as ${resource.status}.`,
      resource.error?.code ?? `engine_${resource.status}`,
      resource.recommendedAction,
      resource.runId
    );
  }
  if (resource.resultAvailability !== "available" || resource.result === undefined) {
    throw new CatalogSelectionEngineError(
      "AI Hub run succeeded without an available catalog-selection result.",
      "engine_result_unavailable",
      "do_not_retry",
      resource.runId
    );
  }

  const advice = catalogSelectionAdviceOutputSchema.parse(resource.result);
  assertAdviceCandidateScope(input, advice);
  return {
    status: "SUCCEEDED",
    runId: resource.runId,
    advice,
    provenance: resource.meta,
  };
}

export function catalogSelectionAdviceInput(input: {
  productClass: string;
  pricePositioning: PricePositioning;
  requestedCount: number;
  candidates: CatalogSelectionAdviceInput["candidates"];
}): CatalogSelectionAdviceInput {
  return catalogSelectionAdviceInputSchema.parse({
    version: CATALOG_SELECTION_ADVICE_INPUT_VERSION,
    ...input,
  });
}

function assertAdviceCandidateScope(
  input: CatalogSelectionAdviceInput,
  output: CatalogSelectionAdviceOutput
): void {
  const allowed = new Set(input.candidates.map((candidate) => candidate.candidateId));
  const returned = output.assessments.map((assessment) => assessment.candidateId);
  if (
    returned.some((candidateId) => !allowed.has(candidateId)) ||
    new Set(returned).size !== returned.length
  ) {
    throw new CatalogSelectionEngineError(
      "AI Hub catalog advice referenced an unknown or duplicate candidate.",
      "engine_candidate_scope_violation",
      "do_not_retry"
    );
  }
}

function engineEndpoint(baseUrl: string): URL {
  const base = new URL(baseUrl);
  const local = ["localhost", "127.0.0.1", "::1"].includes(base.hostname);
  if (base.protocol !== "https:" && !(local && base.protocol === "http:")) {
    throw new Error("AI Hub URL must use HTTPS (HTTP is allowed only for loopback development)." );
  }
  base.pathname = "/api/engine/v1/runs";
  base.search = "";
  base.hash = "";
  return base;
}

function validateCredential(token: string): void {
  if (token.length < 24 || token.length > 512 || /\s/.test(token)) {
    throw new Error("AI Hub service token has an invalid shape.");
  }
}

function boundedText(
  value: string,
  field: string,
  min: number,
  max: number
): string {
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new Error(`${field} must be ${min}-${max} characters.`);
  }
  return normalized;
}

async function boundedJson(response: Response): Promise<unknown> {
  const maxBytes = 1_048_576;
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new CatalogSelectionEngineError(
      "AI Hub response exceeded the 1 MiB client limit.",
      "engine_response_too_large",
      "do_not_retry"
    );
  }
  if (!response.body) {
    throw new CatalogSelectionEngineError(
      "AI Hub returned an empty response body.",
      "invalid_engine_response",
      "do_not_retry"
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    totalBytes += chunk.value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel("response-size-limit");
      throw new CatalogSelectionEngineError(
        "AI Hub response exceeded the 1 MiB client limit.",
        "engine_response_too_large",
        "do_not_retry"
      );
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();
  try {
    return JSON.parse(text);
  } catch {
    throw new CatalogSelectionEngineError(
      "AI Hub returned malformed JSON.",
      "invalid_engine_response",
      "do_not_retry"
    );
  }
}
