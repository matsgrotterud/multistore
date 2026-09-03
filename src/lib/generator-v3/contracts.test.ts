import assert from "node:assert/strict";
import test from "node:test";
import {
  parseNicheIntentV1,
  proposeRuntimeProductClassV1,
  resolveNicheIntentFromProfileV1,
} from "./index";

test("complete persisted runtime intent round-trips through the V3 parser", () => {
  const input = { niche: "cowboy hats adults", endUser: "adults" };
  const proposal = proposeRuntimeProductClassV1(input);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;

  const intent = resolveNicheIntentFromProfileV1(input, proposal.profile);
  assert.deepEqual(parseNicheIntentV1(JSON.parse(JSON.stringify(intent))), intent);
});

test("persisted intents without complete exclusion evidence fail closed", () => {
  const input = { niche: "cowboy hats adults" };
  const proposal = proposeRuntimeProductClassV1(input);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;

  const intent = resolveNicheIntentFromProfileV1(input, proposal.profile);
  const incomplete = { ...intent, excludedClassRules: undefined };
  assert.equal(parseNicheIntentV1(incomplete), null);
  assert.equal(
    parseNicheIntentV1({
      ...intent,
      excludedClassRules: [{ className: "decor", concepts: ["wall decor", 7] }],
    }),
    null
  );
});
