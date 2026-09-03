import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClassQueryPlanV1,
  buildGenerationResultV1,
  evaluateCandidateV1,
  PRODUCT_ONTOLOGY_V1,
  profileFromStaticOntologyV1,
  proposeRuntimeProductClassV1,
  resolveNicheIntentV1,
  resolveNicheIntentFromProfileV1,
  validateRuntimeProductClassProfileV1,
} from "./index";

const readyFacts = {
  providerKey: "supplier",
  externalId: "hat-1",
  usableStoredMediaCount: 2,
  variantIdentityReady: true,
  price: 45,
  marginPercent: 40,
  shippingDaysMax: 10,
  groundedContentReady: true,
};

test("static ontology entries become deterministic pinned profiles", () => {
  const ontology = PRODUCT_ONTOLOGY_V1.find(
    (entry) => entry.productClass === "pet.dog-toys"
  );
  assert.ok(ontology);
  const first = profileFromStaticOntologyV1(ontology);
  const second = profileFromStaticOntologyV1(ontology);
  assert.deepEqual(first, second);
  assert.equal(first.source, "STATIC_ONTOLOGY");
  assert.equal(first.requiresAdminConfirmation, false);
  assert.equal(first.policyDecision, "ALLOW");
  assert.equal(first.liveCommerceAllowed, true);

  const pinned = resolveNicheIntentFromProfileV1(
    { niche: "dog puzzle toys", endUser: "dogs" },
    first
  );
  assert.equal(pinned.productClass, "pet.dog-toys");
  assert.deepEqual(pinned.requiredClassConcepts, ontology.classConcepts);
  assert.deepEqual(pinned.excludedClassRules, ontology.excludedClasses);
});

test("proposes one deterministic preview-only profile for adult cowboy hats", () => {
  const input = { niche: "Cowboy hats adults", endUser: "adults" };
  const first = proposeRuntimeProductClassV1(input);
  const second = proposeRuntimeProductClassV1(input);

  assert.deepEqual(first, second);
  assert.equal(first.status, "PROPOSED");
  if (first.status !== "PROPOSED") return;

  assert.equal(first.profile.normalizedProductType, "cowboy hats");
  assert.equal(first.profile.headNoun, "hat");
  assert.deepEqual(first.profile.classConcepts, ["cowboy hats", "cowboy hat"]);
  assert.equal(first.profile.category.slug, "cowboy-hats");
  assert.equal(first.profile.source, "RUNTIME_PROVISIONAL");
  assert.equal(first.profile.serverOwned, true);
  assert.equal(first.profile.requiresAdminConfirmation, true);
  assert.equal(first.profile.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(first.profile.liveCommerceAllowed, false);
  assert.equal(first.profile.autonomousLaunchAllowed, false);
  assert.equal(first.profile.riskFlags.some((flag) => /ADULT/.test(flag)), false);
});

test("runtime profile fields cannot be widened by a submitted object", () => {
  const input = { niche: "cowboy hats adults" };
  const proposal = proposeRuntimeProductClassV1(input);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;

  assert.deepEqual(
    validateRuntimeProductClassProfileV1(input, proposal.profile),
    proposal.profile
  );
  assert.equal(
    validateRuntimeProductClassProfileV1(input, {
      ...proposal.profile,
      policyDecision: "ALLOW",
      liveCommerceAllowed: true,
      autonomousLaunchAllowed: true,
    }),
    null
  );

  const rejectedIntent = resolveNicheIntentV1(input, {
    ...proposal.profile,
    policyDecision: "ALLOW",
    liveCommerceAllowed: true,
    autonomousLaunchAllowed: true,
  });
  assert.equal(rejectedIntent.productClass, null);
  assert.equal(rejectedIntent.liveCommerceAllowed, false);
});

test("confirmed cowboy-hat profile drives queries and relevance without static ontology", () => {
  const input = { niche: "cowboy hats adults", endUser: "adults" };
  const proposal = proposeRuntimeProductClassV1(input);
  assert.equal(proposal.status, "PROPOSED");
  if (proposal.status !== "PROPOSED") return;

  const intent = resolveNicheIntentV1(input, proposal.profile);
  assert.equal(intent.productClass, proposal.profile.productClass);
  assert.equal(intent.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(intent.liveCommerceAllowed, false);
  assert.equal(intent.autonomousLaunchAllowed, false);
  assert.deepEqual(intent.requiredClassConcepts, ["cowboy hats", "cowboy hat"]);

  const queryPlan = buildClassQueryPlanV1(intent);
  assert.ok(queryPlan.queries.length > 0);
  assert.equal(
    queryPlan.queries.every((query) => /cowboy hats?/.test(query.query)),
    true
  );

  const positive = evaluateCandidateV1(intent, {
    title: "Classic felt cowboy hat for adults",
    description: "Wide brim western-style headwear with an adjustable inner band.",
    ...readyFacts,
  });
  assert.equal(positive.relevance.state, "PASS");
  assert.equal(positive.policy.state, "REVIEW");
  assert.equal(positive.previewVisibility.state, "PASS");
  assert.equal(positive.liveCommerceEligibility.state, "FAIL");

  for (const title of [
    "Leather cowboy boots for adults",
    "Mini cowboy hat keychain",
    "Miniature cowboy hat for a fashion doll",
    "Cowboy hat wall decor poster",
  ]) {
    const evaluation = evaluateCandidateV1(intent, { title, ...readyFacts });
    assert.equal(evaluation.relevance.state, "FAIL", title);
    assert.equal(evaluation.previewVisibility.state, "FAIL", title);
    assert.equal(evaluation.liveCommerceEligibility.state, "FAIL", title);
  }
});

test("generic and non-physical niches remain unproposed", () => {
  for (const niche of [
    "quantum lifestyle essentials",
    "premium products",
    "cool stuff",
    "business software",
  ]) {
    const proposal = proposeRuntimeProductClassV1({ niche });
    assert.equal(proposal.status, "AMBIGUOUS", niche);
    assert.equal(proposal.profile, null, niche);
  }
});

test("risky runtime niches are policy-blocked before queries or preview", () => {
  for (const niche of [
    "medical diagnostic devices",
    "kids bicycle helmets",
    "adult sex toys",
    "rifle accessories",
  ]) {
    const proposal = proposeRuntimeProductClassV1({ niche });
    assert.equal(proposal.status, "BLOCKED", niche);
    assert.equal(proposal.profile, null, niche);

    const intent = resolveNicheIntentV1({ niche });
    assert.equal(intent.productClass, null, niche);
    assert.equal(intent.policyDecision, "BLOCK", niche);
    assert.equal(intent.liveCommerceAllowed, false, niche);
    assert.equal(intent.autonomousLaunchAllowed, false, niche);
    assert.deepEqual(buildClassQueryPlanV1(intent).queries, [], niche);

    const evaluation = evaluateCandidateV1(intent, {
      title: niche,
      ...readyFacts,
    });
    assert.equal(evaluation.policy.state, "FAIL", niche);
    assert.deepEqual(evaluation.policy.reasonCodes, ["POLICY_PRODUCT_CLASS_BLOCKED"]);
    assert.equal(evaluation.previewVisibility.state, "FAIL", niche);
    assert.equal(evaluation.liveCommerceEligibility.state, "FAIL", niche);

    const generation = buildGenerationResultV1({
      intent,
      minimumProducts: 1,
      relevantProducts: 10,
      previewVisibleProducts: 10,
      importedProducts: 10,
      importBudget: 10,
    });
    assert.equal(generation.status, "POLICY_BLOCKED", niche);
    assert.equal(generation.previewReady, false, niche);
    assert.equal(generation.liveCommerceAllowed, false, niche);
  }
});
