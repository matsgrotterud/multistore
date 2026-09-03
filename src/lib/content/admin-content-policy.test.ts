import assert from "node:assert/strict";
import test from "node:test";
import {
  decideAdminContentPolicy,
  publicContentPath,
  validateFaqBody,
  type AdminContentPolicyInput,
} from "./admin-content-policy";

const LONG_BODY = Array.from(
  { length: 140 },
  (_, index) => `specific useful editorial word ${index}`
).join(" ");

function input(
  overrides: Partial<AdminContentPolicyInput> = {}
): AdminContentPolicyInput {
  return {
    storeLaunchStatus: "LIVE",
    type: "GUIDE",
    title: "A practical editorial guide",
    excerpt: "A grounded introduction for readers planning their next decision.",
    body: LONG_BODY,
    seoTitle: "A practical editorial guide | Example Store",
    seoDescription:
      "A grounded and detailed editorial guide for readers who want a clear framework before making a decision.",
    requestedPublished: true,
    requestedNoindex: false,
    ...overrides,
  };
}

test("safe substantial LIVE guide content may publish and index", () => {
  const decision = decideAdminContentPolicy(input());
  assert.equal(decision.isPublished, true);
  assert.equal(decision.noindex, false);
  assert.deepEqual(decision.reasonCodes, []);
});

test("PREVIEW and DRAFT content always remain noindex", () => {
  for (const storeLaunchStatus of ["PREVIEW", "DRAFT"]) {
    const decision = decideAdminContentPolicy(input({ storeLaunchStatus }));
    assert.equal(decision.isPublished, true);
    assert.equal(decision.noindex, true);
    assert.ok(decision.reasonCodes.includes("STORE_NOT_LIVE_NOINDEX"));
  }
});

test("fake claims and scarcity are saved only as unpublished noindex drafts", () => {
  const decision = decideAdminContentPolicy(
    input({ body: `${LONG_BODY} Clinically proven. Only 2 left.` })
  );
  assert.equal(decision.saveAllowed, true);
  assert.equal(decision.isPublished, false);
  assert.equal(decision.noindex, true);
  assert.ok(decision.reasonCodes.includes("CONTENT_GUARDRAIL_BLOCKED"));
});

test("thin and duplicate-ish content is automatically noindex", () => {
  const body = "A short but harmless editorial note without enough depth.";
  const thin = decideAdminContentPolicy(input({ body }));
  assert.equal(thin.isPublished, true);
  assert.equal(thin.noindex, true);
  assert.ok(thin.reasonCodes.includes("CONTENT_QUALITY_NOINDEX"));

  const duplicate = decideAdminContentPolicy(
    input({ siblingTexts: [LONG_BODY] })
  );
  assert.equal(duplicate.noindex, true);
  assert.ok(duplicate.reasonCodes.includes("CONTENT_QUALITY_NOINDEX"));
});

test("unrouted page types and singleton conflicts cannot publish", () => {
  const landing = decideAdminContentPolicy(input({ type: "LANDING" }));
  assert.equal(landing.isPublished, false);
  assert.ok(landing.reasonCodes.includes("CONTENT_TYPE_NOT_ROUTED"));

  const faq = decideAdminContentPolicy(
    input({ type: "FAQ", anotherPublishedSingletonExists: true })
  );
  assert.equal(faq.isPublished, false);
  assert.ok(faq.reasonCodes.includes("CONTENT_SINGLETON_CONFLICT"));
});

test("FAQ JSON and public route mapping are explicit", () => {
  assert.equal(
    validateFaqBody('[{"question":"What is this?","answer":"A safe draft."}]'),
    true
  );
  assert.equal(validateFaqBody("not-json"), false);
  assert.equal(
    publicContentPath({ storeSlug: "store", type: "GUIDE", slug: "guide" }),
    "/s/store/guides/guide"
  );
  assert.equal(
    publicContentPath({ storeSlug: "store", type: "LANDING", slug: "landing" }),
    null
  );
});
