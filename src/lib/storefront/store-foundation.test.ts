import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStoreFoundation,
  type BuildStoreFoundationInput,
} from "./store-foundation";
import { presentationForArchetype } from "./presentation";

function input(
  overrides: Partial<BuildStoreFoundationInput> = {}
): BuildStoreFoundationInput {
  return {
    identity: {
      brandName: "Northlight Studio",
      logoText: "Northlight",
      niche: "compact home lighting",
      audience: "people shaping calm, useful rooms",
      brandVoice: "clear, warm and practical",
      locale: "nb-NO",
      country: "Norway",
    },
    positioning: "A focused visual identity for thoughtful homes.",
    presentation: presentationForArchetype("editorial"),
    theme: {
      primaryColor: "#1d4ed8",
      backgroundColor: "#f8fafc",
      textColor: "#0f172a",
    },
    ...overrides,
  };
}

test("the same foundation input is byte-identical and digest-stable", () => {
  const first = buildStoreFoundation(input());
  const second = buildStoreFoundation(input());
  assert.deepEqual(first, second);
  assert.match(first.inputDigest, /^[a-f0-9]{64}$/);
  assert.match(first.foundationDigest, /^[a-f0-9]{64}$/);
  assert.equal(first.audit.status, "PASS");
});

test("audience, voice, locale and presentation changes invalidate the input digest", () => {
  const base = buildStoreFoundation(input());
  const variations = [
    input({ identity: { ...input().identity, audience: "small-space renters" } }),
    input({ identity: { ...input().identity, brandVoice: "precise and technical" } }),
    input({ identity: { ...input().identity, locale: "en-GB" } }),
    input({ presentation: presentationForArchetype("technical") }),
  ];
  for (const variation of variations) {
    assert.notEqual(buildStoreFoundation(variation).inputDigest, base.inputDigest);
  }
});

test("all renderable foundation blocks carry allowlisted evidence", () => {
  const foundation = buildStoreFoundation(input());
  const entries = [
    foundation.homepage.hero,
    ...foundation.homepage.principles,
    foundation.homepage.catalogStatus,
    ...foundation.seoDraft.topicBriefs,
  ];
  assert.ok(entries.every((entry) => entry.evidenceRefs.length > 0));
  assert.ok(
    entries.every((entry) =>
      entry.evidenceRefs.every((reference) =>
        /^(merchant-brief|store-state|platform-policy):/.test(reference)
      )
    )
  );
});

test("empty-catalog foundation avoids price, inventory, delivery, testing and scarcity claims", () => {
  const foundation = buildStoreFoundation(input());
  const text = JSON.stringify(foundation).toLowerCase();
  for (const phrase of [
    "in stock",
    "out of stock",
    "delivery estimate",
    "business days",
    "best seller",
    "clinically proven",
    "customer reviews",
    "only 2 left",
    "limited time",
  ]) {
    assert.equal(text.includes(phrase), false, phrase);
  }
  assert.deepEqual(foundation.audit.blockedClaims, []);
});

test("commercial-research briefs remain locked until catalog evidence exists", () => {
  const foundation = buildStoreFoundation(input());
  const commercial = foundation.seoDraft.topicBriefs.filter(
    (brief) => brief.searchIntent === "COMMERCIAL_RESEARCH"
  );
  assert.ok(commercial.length > 0);
  assert.ok(commercial.every((brief) => brief.state === "WAITING_FOR_CATALOG"));
  assert.equal(foundation.seoDraft.status, "DRAFT_NOINDEX");
});

test("unsafe merchant overrides are retained for review but never pass the audit", () => {
  const foundation = buildStoreFoundation(
    input({
      overrides: {
        heroTitle: "Best seller — only 2 left",
        heroBody:
          "Customer reviews prove premium quality and delivery in two business days for every item.",
      },
    })
  );
  assert.equal(foundation.audit.status, "REVIEW");
  assert.ok(foundation.audit.blockedClaims.includes("DELIVERY_CLAIM"));
  assert.ok(foundation.audit.blockedClaims.includes("INVENTORY_CLAIM"));
  assert.ok(foundation.audit.blockedClaims.includes("REVIEW_CLAIM"));
});

test("inaccessible body contrast is review-blocked", () => {
  const foundation = buildStoreFoundation(
    input({
      theme: {
        primaryColor: "#1d4ed8",
        backgroundColor: "#ffffff",
        textColor: "#eeeeee",
      },
    })
  );
  assert.equal(foundation.audit.status, "REVIEW");
  assert.equal(
    foundation.audit.checks.find((check) => check.id === "TEXT_CONTRAST")?.status,
    "REVIEW"
  );
});
