import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_SELECTION_ADVICE_OUTPUT_VERSION,
  CatalogSelectionEngineError,
  MULTISTORE_CATALOG_SELECTION_CAPABILITY_ID,
  MULTISTORE_CATALOG_SELECTION_CAPABILITY_VERSION,
  catalogSelectionAdviceInput,
  runCatalogSelectionAdvice,
} from "./catalog-selection-engine";

const INPUT = catalogSelectionAdviceInput({
  productClass: "electronics.camera-drones",
  pricePositioning: "value",
  requestedCount: 8,
  candidates: [
    {
      candidateId: "candidate-1",
      title: "Foldable 4K Camera Drone",
      supplierUnitCost: 49,
      currency: "USD",
      shippingCost: 7,
      shippingDaysMax: 12,
      stockStatus: "IN_STOCK",
      supplierScore: 84,
      mediaCount: 5,
      manualReviewTerms: ["drone", "battery"],
      hardGatesPassed: true,
    },
  ],
});

const META = {
  productId: "multistore",
  tenantId: "tenant-1",
  provider: "openai",
  model: "test-model",
  providerResponseId: "response-1",
  releaseId: "release-1",
  releaseHash: "hash-1",
  modelPolicyVersion: "policy-1",
};

function engineResource(result: unknown) {
  return {
    ok: true,
    runId: "eng_test_1",
    capability: {
      id: MULTISTORE_CATALOG_SELECTION_CAPABILITY_ID,
      version: MULTISTORE_CATALOG_SELECTION_CAPABILITY_VERSION,
    },
    status: "succeeded",
    approval: {
      mode: "human_before_tool",
      state: "required",
      outputDisposition: "proposal_only",
    },
    meta: META,
    resultAvailability: "available",
    result,
    recommendedAction: "do_not_retry",
  };
}

test("posts one fixed, versioned proposal request and validates provenance", async () => {
  let observed: { url?: string; init?: RequestInit } = {};
  const result = await runCatalogSelectionAdvice({
    baseUrl: "https://ai.example.test/ignored",
    serviceToken: "t".repeat(32),
    tenantId: "tenant-1",
    idempotencyKey: "selection-run-1",
    input: INPUT,
    fetchFn: async (url, init) => {
      observed = { url: String(url), init };
      return Response.json(
        engineResource({
          version: CATALOG_SELECTION_ADVICE_OUTPUT_VERSION,
          assessments: [
            {
              candidateId: "candidate-1",
              semanticFit: 0.95,
              valueFit: 0.8,
              merchandisingRole: "value anchor",
              reasonCodes: ["CLASS_FIT_HIGH"],
            },
          ],
        })
      );
    },
  });

  assert.equal(result.status, "SUCCEEDED");
  assert.equal(observed.url, "https://ai.example.test/api/engine/v1/runs");
  assert.equal(observed.init?.redirect, "error");
  assert.equal(
    (observed.init?.headers as Record<string, string>).Authorization,
    `Bearer ${"t".repeat(32)}`
  );
  const body = JSON.parse(String(observed.init?.body));
  assert.equal(body.capabilityId, MULTISTORE_CATALOG_SELECTION_CAPABILITY_ID);
  assert.equal(body.capabilityVersion, MULTISTORE_CATALOG_SELECTION_CAPABILITY_VERSION);
  assert.equal(body.tenantId, "tenant-1");
  assert.equal(body.input.candidates[0].hardGatesPassed, true);
});

test("returns pending without retrying an in-progress idempotent run", async () => {
  let calls = 0;
  const result = await runCatalogSelectionAdvice({
    baseUrl: "http://localhost:3009",
    serviceToken: "t".repeat(32),
    tenantId: "tenant-1",
    idempotencyKey: "selection-run-2",
    input: INPUT,
    fetchFn: async () => {
      calls += 1;
      return Response.json(
        {
          ...engineResource(undefined),
          status: "running",
          resultAvailability: undefined,
          recommendedAction: "poll",
        },
        { status: 202 }
      );
    },
  });

  assert.deepEqual(result, {
    status: "PENDING",
    runId: "eng_test_1",
    recommendedAction: "poll",
  });
  assert.equal(calls, 1);
});

test("rejects out-of-scope model output instead of widening the shortlist", async () => {
  await assert.rejects(
    runCatalogSelectionAdvice({
      baseUrl: "https://ai.example.test",
      serviceToken: "t".repeat(32),
      tenantId: "tenant-1",
      idempotencyKey: "selection-run-3",
      input: INPUT,
      fetchFn: async () =>
        Response.json(
          engineResource({
            version: CATALOG_SELECTION_ADVICE_OUTPUT_VERSION,
            assessments: [
              {
                candidateId: "invented-candidate",
                semanticFit: 1,
                valueFit: 1,
                merchandisingRole: "invented",
                reasonCodes: [],
              },
            ],
          })
        ),
    }),
    (error: unknown) =>
      error instanceof CatalogSelectionEngineError &&
      error.code === "engine_candidate_scope_violation"
  );
});

test("rejects response provenance from a different tenant", async () => {
  await assert.rejects(
    runCatalogSelectionAdvice({
      baseUrl: "https://ai.example.test",
      serviceToken: "t".repeat(32),
      tenantId: "tenant-1",
      idempotencyKey: "selection-run-tenant",
      input: INPUT,
      fetchFn: async () =>
        Response.json({
          ...engineResource({
            version: CATALOG_SELECTION_ADVICE_OUTPUT_VERSION,
            assessments: [],
          }),
          meta: { ...META, tenantId: "tenant-2" },
        }),
    }),
    (error: unknown) =>
      error instanceof CatalogSelectionEngineError &&
      error.code === "engine_tenant_scope_violation"
  );
});

test("ambiguous transport failure requires reconciliation with the same key", async () => {
  await assert.rejects(
    runCatalogSelectionAdvice({
      baseUrl: "https://ai.example.test",
      serviceToken: "t".repeat(32),
      tenantId: "tenant-1",
      idempotencyKey: "selection-run-4",
      input: INPUT,
      fetchFn: async () => {
        throw new Error("socket closed");
      },
    }),
    (error: unknown) =>
      error instanceof CatalogSelectionEngineError &&
      error.recommendedAction === "retry_same_key"
  );
});

test("the transport deadline also bounds a stalled response body", async () => {
  await assert.rejects(
    runCatalogSelectionAdvice({
      baseUrl: "https://ai.example.test",
      serviceToken: "t".repeat(32),
      tenantId: "tenant-1",
      idempotencyKey: "selection-run-5",
      input: INPUT,
      timeoutMs: 250,
      fetchFn: async (_url, init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener("abort", () =>
                controller.error(new DOMException("Aborted", "AbortError"))
              );
            },
          })
        ),
    }),
    (error: unknown) =>
      error instanceof CatalogSelectionEngineError &&
      error.code === "engine_outcome_indeterminate" &&
      error.recommendedAction === "retry_same_key"
  );
});

test("an interrupted response body retains the retry-same-key contract", async () => {
  await assert.rejects(
    runCatalogSelectionAdvice({
      baseUrl: "https://ai.example.test",
      serviceToken: "t".repeat(32),
      tenantId: "tenant-1",
      idempotencyKey: "selection-run-stream",
      input: INPUT,
      fetchFn: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('{"ok":true'));
              controller.error(new Error("connection reset"));
            },
          })
        ),
    }),
    (error: unknown) =>
      error instanceof CatalogSelectionEngineError &&
      error.code === "engine_outcome_indeterminate" &&
      error.recommendedAction === "retry_same_key"
  );
});

test("the 1 MiB response limit is enforced on UTF-8 bytes while streaming", async () => {
  await assert.rejects(
    runCatalogSelectionAdvice({
      baseUrl: "https://ai.example.test",
      serviceToken: "t".repeat(32),
      tenantId: "tenant-1",
      idempotencyKey: "selection-run-size",
      input: INPUT,
      fetchFn: async () => new Response(JSON.stringify({ value: "é".repeat(600_000) })),
    }),
    (error: unknown) =>
      error instanceof CatalogSelectionEngineError &&
      error.code === "engine_response_too_large" &&
      error.recommendedAction === "do_not_retry"
  );
});
