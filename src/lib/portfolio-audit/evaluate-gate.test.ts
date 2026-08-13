import assert from "node:assert/strict";
import test from "node:test";
import { evaluateGate } from "./evaluate-gate";
import type { AuditEvidence, EvidenceState, GatePolicy } from "./types";

const hardBooleanPolicy: GatePolicy = {
  schemaVersion: 1,
  id: "launch.readiness",
  rules: [
    {
      id: "domain.ready",
      level: "HARD",
      predicate: { op: "eq", fact: "domain.ready", value: true },
    },
  ],
};

function evidence(
  state: EvidenceState,
  overrides: Partial<AuditEvidence> = {}
): AuditEvidence {
  return {
    key: "domain.ready",
    state,
    provenance: "VERIFIED",
    value: true,
    ...overrides,
  };
}

test("passes a HARD rule only with matching PASS + VERIFIED evidence", () => {
  const result = evaluateGate(hardBooleanPolicy, [evidence("PASS")]);

  assert.equal(result.decision, "PASS");
  assert.equal(result.rules[0]?.status, "PASS");
  assert.equal(result.rules[0]?.predicateMatched, true);
});

for (const state of ["FAIL", "UNKNOWN", "STALE"] as const) {
  test(`blocks a HARD rule when evidence is ${state}`, () => {
    const result = evaluateGate(hardBooleanPolicy, [evidence(state)]);

    assert.equal(result.decision, "BLOCKED");
    assert.equal(result.rules[0]?.status, state);
    assert.equal(result.rules[0]?.predicateMatched, null);
  });
}

test("treats missing evidence as UNKNOWN and blocks", () => {
  const result = evaluateGate(hardBooleanPolicy, []);

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.status, "UNKNOWN");
  assert.deepEqual(result.rules[0]?.evidenceKeys, ["domain.ready"]);
});

test("AI_INFERRED evidence cannot satisfy a matching HARD rule", () => {
  const result = evaluateGate(hardBooleanPolicy, [
    evidence("PASS", { provenance: "AI_INFERRED" }),
  ]);

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.status, "AI_INFERRED");
  assert.equal(result.rules[0]?.predicateMatched, true);
  assert.equal(result.rules[0]?.reasons[0]?.code, "AI_INFERRED_EVIDENCE");
});

test("AI_INFERRED evidence raises REVIEW for an advisory rule", () => {
  const policy: GatePolicy = {
    ...hardBooleanPolicy,
    rules: [{ ...hardBooleanPolicy.rules[0]!, id: "domain.advisory", level: "ADVISORY" }],
  };
  const result = evaluateGate(policy, [
    evidence("PASS", { provenance: "AI_INFERRED" }),
  ]);

  assert.equal(result.decision, "REVIEW");
  assert.equal(result.rules[0]?.status, "AI_INFERRED");
});

test("fails closed on a numeric predicate type mismatch", () => {
  const policy: GatePolicy = {
    schemaVersion: 1,
    id: "commercial.readiness",
    rules: [
      {
        id: "margin.minimum",
        level: "HARD",
        predicate: { op: "gte", fact: "margin.percent", value: 25 },
      },
    ],
  };
  const result = evaluateGate(policy, [
    {
      key: "margin.percent",
      state: "PASS",
      provenance: "VERIFIED",
      value: "35",
    },
  ]);

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.status, "FAIL");
  assert.equal(result.rules[0]?.reasons[0]?.code, "PREDICATE_TYPE_MISMATCH");
});

test("does not invert a type mismatch into a matching not predicate", () => {
  const policy: GatePolicy = {
    schemaVersion: 1,
    id: "commercial.readiness",
    rules: [
      {
        id: "margin.not-low",
        level: "HARD",
        predicate: {
          op: "not",
          predicate: { op: "lte", fact: "margin.percent", value: 10 },
        },
      },
    ],
  };
  const result = evaluateGate(policy, [
    {
      key: "margin.percent",
      state: "PASS",
      provenance: "VERIFIED",
      value: "unknown",
    },
  ]);

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.status, "FAIL");
  assert.equal(result.rules[0]?.predicateMatched, false);
  assert.equal(result.rules[0]?.reasons[0]?.code, "PREDICATE_TYPE_MISMATCH");
});

test("rejects operators outside the predicate allowlist", () => {
  const result = evaluateGate(
    {
      schemaVersion: 1,
      id: "unsafe.policy",
      rules: [
        {
          id: "unsafe.rule",
          level: "HARD",
          predicate: { op: "execute", code: "return true" },
        },
      ],
    },
    []
  );

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.ruleId, "policy.invalid");
  assert.equal(result.rules[0]?.status, "FAIL");
});

test("returns BLOCKED instead of throwing for a cyclic predicate input", () => {
  const predicate: Record<string, unknown> = { op: "not" };
  predicate.predicate = predicate;

  const result = evaluateGate(
    {
      schemaVersion: 1,
      id: "cyclic.policy",
      rules: [{ id: "cyclic.rule", level: "HARD", predicate }],
    },
    []
  );

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.ruleId, "policy.invalid");
  assert.deepEqual(result.rules[0]?.reasons, [
    {
      code: "POLICY_INVALID",
      message: "<root>: Policy validation could not be completed safely.",
    },
  ]);
});

test("rejects duplicate evidence instead of choosing an arbitrary value", () => {
  const result = evaluateGate(hardBooleanPolicy, [evidence("PASS"), evidence("FAIL")]);

  assert.equal(result.decision, "BLOCKED");
  assert.equal(result.rules[0]?.ruleId, "evidence.invalid");
});

test("sorts rule results, evidence keys and reasons deterministically", () => {
  const policyA: GatePolicy = {
    schemaVersion: 1,
    id: "stable.policy",
    rules: [
      {
        id: "z.rule",
        level: "HARD",
        predicate: {
          op: "all",
          predicates: [
            { op: "eq", fact: "z.fact", value: true },
            { op: "eq", fact: "a.fact", value: true },
          ],
        },
      },
      {
        id: "a.rule",
        level: "ADVISORY",
        predicate: { op: "in", fact: "mode", values: ["safe", "preview"] },
      },
    ],
  };
  const policyB: GatePolicy = { ...policyA, rules: [...policyA.rules].reverse() };
  const facts: AuditEvidence[] = [
    { key: "z.fact", state: "PASS", provenance: "VERIFIED", value: true },
    { key: "mode", state: "PASS", provenance: "VERIFIED", value: "safe" },
    { key: "a.fact", state: "PASS", provenance: "VERIFIED", value: true },
  ];

  const resultA = evaluateGate(policyA, facts);
  const resultB = evaluateGate(policyB, [...facts].reverse());

  assert.deepEqual(resultA, resultB);
  assert.deepEqual(
    resultA.rules.map((rule) => rule.ruleId),
    ["a.rule", "z.rule"]
  );
  assert.deepEqual(resultA.rules[1]?.evidenceKeys, ["a.fact", "z.fact"]);
});
