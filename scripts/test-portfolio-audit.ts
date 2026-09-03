import "../src/lib/portfolio-audit/evaluate-gate.test";
import assert from "node:assert/strict";
import test from "node:test";
import { collectRepoEvidence } from "@/lib/portfolio-audit/collect-repo-evidence";
import { stableJson } from "@/lib/portfolio-audit/stable-json";
import "../src/lib/tenant/edge-routing.test";

test("the current repository cannot be reported as scale-ready", () => {
  const evidence = collectRepoEvidence({ typecheckPassed: true });
  const byKey = new Map(evidence.map((item) => [item.key, item]));

  assert.equal(byKey.get("tenant.unknown-host-fails-closed")?.state, "PASS");
  assert.equal(byKey.get("commerce.preview-checkout-blocked")?.state, "PASS");
  assert.equal(byKey.get("commerce.mock-isolated-from-suppliers")?.state, "PASS");
  assert.equal(byKey.get("commerce.single-fulfillment-route")?.state, "PASS");
  assert.equal(byKey.get("commerce.fulfillment-idempotent")?.state, "PASS");
  assert.equal(byKey.get("runtime.local-smoke")?.state, "UNKNOWN");
  assert.equal(byKey.get("tenant.single-domain-authority")?.state, "PASS");
  assert.equal(byKey.get("commerce.refunds-operable")?.state, "FAIL");
  assert.equal(byKey.get("product.compliance-dossier")?.state, "FAIL");
  assert.equal(byKey.get("product.recall-operable")?.state, "FAIL");
  assert.equal(byKey.get("security.production-auth")?.state, "FAIL");
  assert.equal(byKey.get("ai.provider-non-mock")?.state, "FAIL");
});

test("stable JSON sorts object keys recursively", () => {
  assert.equal(
    stableJson({ z: 1, a: { z: true, a: false } }),
    '{\n  "a": {\n    "a": false,\n    "z": true\n  },\n  "z": 1\n}\n'
  );
});
