import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATION_RUN_CONTRACT_VERSION,
  GENERATOR_VERSION,
  isTerminalGenerationStatus,
  normalizeGenerationIdempotencyKey,
  parseGenerationRunSummary,
} from "./generation-run";

test("normalizes a stable, namespaced idempotency key", () => {
  assert.equal(normalizeGenerationIdempotencyKey(" Request 42 "), "genv3-request-42");
  assert.equal(normalizeGenerationIdempotencyKey("Request 42"), "genv3-request-42");
  assert.equal(normalizeGenerationIdempotencyKey("genv3-request-42"), "genv3-request-42");
});

test("recognizes only explicit terminal generation states", () => {
  assert.equal(isTerminalGenerationStatus("READY_FOR_PREVIEW"), true);
  assert.equal(isTerminalGenerationStatus("POLICY_BLOCKED"), true);
  assert.equal(isTerminalGenerationStatus("RUNNING"), false);
  assert.equal(isTerminalGenerationStatus("SUCCESS"), false);
});

test("parses only versioned generator audit summaries", () => {
  const valid = JSON.stringify({
    contractVersion: GENERATION_RUN_CONTRACT_VERSION,
    generatorVersion: GENERATOR_VERSION,
    idempotencyKey: "genv3-a",
    originalInput: {},
    phases: [],
  });
  assert.equal(parseGenerationRunSummary(valid)?.idempotencyKey, "genv3-a");
  assert.equal(parseGenerationRunSummary(JSON.stringify({ phases: [] })), null);
  assert.equal(parseGenerationRunSummary("not-json"), null);
});
