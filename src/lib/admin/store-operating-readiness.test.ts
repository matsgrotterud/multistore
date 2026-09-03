import assert from "node:assert/strict";
import test from "node:test";
import {
  countPersistedContentPolicyViolations,
  type PersistedContentPolicyRow,
} from "./store-operating-readiness";

function page(
  id: string,
  overrides: Partial<PersistedContentPolicyRow> = {}
): PersistedContentPolicyRow {
  return {
    id,
    type: "GUIDE",
    title: "A practical guide for careful shoppers",
    excerpt:
      "A direct and useful introduction that helps readers understand the subject.",
    body: Array.from(
      { length: 220 },
      (_, index) => `grounded guidance ${index}`
    ).join(" "),
    seoTitle: "A practical and grounded guide for careful shoppers",
    seoDescription:
      "A detailed and grounded guide that explains the subject without unsupported product, delivery or scarcity claims.",
    isPublished: true,
    noindex: false,
    ...overrides,
  };
}

test("safe substantial persisted content satisfies the current policy", () => {
  assert.equal(
    countPersistedContentPolicyViolations({
      storeLaunchStatus: "LIVE",
      pages: [page("safe")],
    }),
    0
  );
});

test("blocked claims and unsupported published routes are legacy violations", () => {
  assert.equal(
    countPersistedContentPolicyViolations({
      storeLaunchStatus: "LIVE",
      pages: [
        page("claim", { body: `${page("base").body} Only 2 left in stock.` }),
        page("landing", { type: "LANDING" }),
      ],
    }),
    2
  );
});

test("duplicate published FAQ singletons are both rejected", () => {
  const faqBody = JSON.stringify([
    {
      question: "What is this guide for?",
      answer: "It explains the current store foundation clearly.",
    },
  ]);
  assert.equal(
    countPersistedContentPolicyViolations({
      storeLaunchStatus: "LIVE",
      pages: [
        page("faq-a", { type: "FAQ", body: faqBody }),
        page("faq-b", { type: "FAQ", body: faqBody, noindex: true }),
      ],
    }),
    2
  );
});
