import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmPreparedProductClass,
  prepareStoreBlueprint,
} from "@/lib/ai/store-blueprint";
import { verifyApprovedStorePlanToken } from "@/lib/generator/store-plan";

process.env.GENERATOR_PLAN_SECRET ??= "test-only-generator-plan-secret-123456";

test("preflight resolves children slimy toys before store generation", async () => {
  const result = await prepareStoreBlueprint({
    niche: "children slimy toys",
    targetCustomer: "parents",
    endUser: "children",
  });

  assert.equal(result.status, "READY");
  if (result.status !== "READY") return;

  assert.equal(result.intent.productClass, "toys.slime-kits");
  assert.equal(result.intent.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(result.intent.liveCommerceAllowed, false);
  assert.deepEqual(
    result.blueprint.categories.map((category) => category.name),
    ["Slime kits & sensory play"]
  );
  assert.equal(
    result.blueprint.categories.some((category) => category.name === "Wooden Toys"),
    false
  );
  assert.deepEqual(
    result.blueprint.productImportQueries,
    result.queryPlan.queries.map((entry) => entry.query)
  );
  assert.equal(result.guardrails.passed, true);
});

test("adult cowboy hats require confirmation before creative or supplier execution", async () => {
  const result = await prepareStoreBlueprint({
    niche: "cowboy hats adults",
    targetCustomer: "adult western wear shoppers",
    endUser: "adults",
  });

  assert.equal(result.status, "NEEDS_PRODUCT_CLASS_CONFIRMATION");
  if (result.status !== "NEEDS_PRODUCT_CLASS_CONFIRMATION") return;

  assert.equal(result.proposal.source, "RUNTIME_PROVISIONAL");
  assert.equal(result.proposal.normalizedProductType, "cowboy hats");
  assert.equal(result.proposal.headNoun, "hat");
  assert.deepEqual(result.proposal.classConcepts, ["cowboy hats", "cowboy hat"]);
  assert.deepEqual(result.proposal.category, {
    slug: "cowboy-hats",
    name: "Cowboy Hats",
    description:
      "Cowboy Hats that passed supplier-evidence relevance checks. This provisional class requires merchant review.",
  });
  assert.equal(result.proposal.requiresAdminConfirmation, true);
  assert.equal(result.proposal.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(result.proposal.liveCommerceAllowed, false);
  assert.equal(result.proposal.autonomousLaunchAllowed, false);
  assert.equal(result.intent.productClass, result.proposal.productClass);
  assert.deepEqual(result.intent.requiredClassConcepts, result.proposal.classConcepts);
  assert.equal(result.intent.liveCommerceAllowed, false);
  assert.equal(result.intent.autonomousLaunchAllowed, false);
  assert.deepEqual(
    result.queryPlan.queries.map((entry) => entry.query),
    ["cowboy hats", "cowboy hat"]
  );
  assert.equal("blueprint" in result, false);
  assert.equal("approvedPlanToken" in result, false);
});

test("signed cowboy-hat confirmation produces one exact pinned ready plan", async () => {
  const prepared = await prepareStoreBlueprint({
    niche: "cowboy hats adults",
    targetCustomer: "adult western wear shoppers",
    endUser: "adults",
  });
  assert.equal(prepared.status, "NEEDS_PRODUCT_CLASS_CONFIRMATION");
  if (prepared.status !== "NEEDS_PRODUCT_CLASS_CONFIRMATION") return;

  const result = await confirmPreparedProductClass(prepared.proposalToken);
  assert.equal(result.status, "READY");
  if (result.status !== "READY") return;

  assert.deepEqual(result.classProfile, prepared.proposal);
  assert.deepEqual(result.intent, prepared.intent);
  assert.deepEqual(result.queryPlan, prepared.queryPlan);
  assert.deepEqual(result.blueprint.categories, [prepared.proposal.category]);
  assert.deepEqual(
    result.blueprint.productImportQueries,
    prepared.queryPlan.queries.map((entry) => entry.query)
  );
  assert.equal(result.guardrails.passed, true);

  const approved = verifyApprovedStorePlanToken(result.approvedPlanToken);
  assert.deepEqual(approved.classProfile, result.classProfile);
  assert.deepEqual(approved.intent, result.intent);
  assert.deepEqual(approved.queryPlan, result.queryPlan);
  assert.deepEqual(approved.blueprint, result.blueprint);
  assert.deepEqual(approved.guardrails, result.guardrails);
  assert.match(approved.planDigest, /^[a-f0-9]{64}$/);
});

test("ambiguous preflight returns no invented class, creative, or supplier queries", async () => {
  const result = await prepareStoreBlueprint({
    niche: "quantum lifestyle essentials",
    targetCustomer: "curious shoppers",
  });

  assert.equal(result.status, "NEEDS_PRODUCT_CLASS");
  assert.equal(result.intent.productClass, null);
  assert.deepEqual(result.queryPlan.queries, []);
  assert.equal("blueprint" in result, false);
  assert.equal("guardrails" in result, false);
  assert.equal("proposal" in result, false);
  assert.equal("proposalToken" in result, false);
  assert.equal("approvedPlanToken" in result, false);
});

test("risky runtime niche is blocked before class proposal, creative, or supplier plan", async () => {
  const result = await prepareStoreBlueprint({
    niche: "medical diagnostic devices",
    targetCustomer: "clinic buyers",
  });

  assert.equal(result.status, "BLOCKED");
  if (result.status !== "BLOCKED") return;

  assert.equal(result.intent.productClass, null);
  assert.equal(result.intent.policyDecision, "BLOCK");
  assert.equal(result.intent.liveCommerceAllowed, false);
  assert.equal(result.intent.autonomousLaunchAllowed, false);
  assert.deepEqual(result.queryPlan.queries, []);
  assert.equal(
    result.reasonCodes.includes("RUNTIME_CLASS_MEDICAL_REVIEW_REQUIRED"),
    true
  );
  assert.equal("proposal" in result, false);
  assert.equal("proposalToken" in result, false);
  assert.equal("blueprint" in result, false);
  assert.equal("guardrails" in result, false);
  assert.equal("approvedPlanToken" in result, false);
});
