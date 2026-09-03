import assert from "node:assert/strict";
import test from "node:test";
import { auditStoreFoundation } from "./store-foundation-audit";
import { buildStoreFoundation } from "./store-foundation";
import { presentationForArchetype } from "./presentation";

function foundation() {
  return buildStoreFoundation({
    identity: {
      brandName: "Quiet Form",
      logoText: "Quiet Form",
      niche: "desk organization",
      audience: "people who want calmer workspaces",
      brandVoice: "calm and direct",
      locale: "en-GB",
      country: "United Kingdom",
    },
    positioning: "A calm foundation for focused spaces.",
    presentation: presentationForArchetype("minimal"),
    theme: {
      primaryColor: "#111827",
      backgroundColor: "#ffffff",
      textColor: "#111827",
    },
  });
}

test("a changed subject digest makes persisted foundation evidence stale", () => {
  const current = foundation();
  const audit = auditStoreFoundation(current, {
    expectedInputDigest: "0".repeat(64),
  });
  assert.equal(audit.status, "REVIEW");
  assert.equal(
    audit.checks.find((check) => check.id === "FOUNDATION_INPUT_CURRENT")?.status,
    "REVIEW"
  );
});

test("a matching subject digest preserves the complete pass", () => {
  const current = foundation();
  const audit = auditStoreFoundation(current, {
    expectedInputDigest: current.inputDigest,
  });
  assert.equal(audit.status, "PASS");
  assert.ok(audit.checks.every((check) => check.status === "PASS"));
});
