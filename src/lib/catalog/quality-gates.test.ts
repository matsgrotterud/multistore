import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCandidateQuality } from "./quality-gates";

function evaluate(
  title: string,
  description: string,
  manualReviewTerms: string[] = []
) {
  return evaluateCandidateQuality({
    title,
    description,
    sourceUrl: "https://supplier.example/products/one",
    externalId: "supplier-product-1",
    shippingDaysMin: 5,
    shippingDaysMax: 12,
    mediaCount: 2,
    score: 80,
    minScore: 50,
    marginPercent: 35,
    minMarginPercent: 25,
    manualReviewTerms,
  });
}

test("machine-only URLs, HTML attributes and hashes do not trigger CBD review", () => {
  const result = evaluate(
    "Warm fleece slippers",
    [
      "<p>Soft fleece lining for indoor use.</p>",
      '<img data-hash="cbd" src="https://cdn.example/cbd/assets/abcbd123.jpg#cbd">',
      "Asset: https://cdn.example/media/cbd/photo.jpg#cbd",
      "Checksum: 12abcbdeadbeef9988",
    ].join(" ")
  );

  assert.equal(result.passes, true);
  assert.deepEqual(result.risk, {});
});

test("visible CBD product claims still require manual review", () => {
  const result = evaluate("CBD massage oil", "Contains hemp-derived CBD.");

  assert.equal(result.passes, false);
  assert.deepEqual(result.risk.restrictedTerms, ["cbd"]);
});

test("drone battery terms permit internal evaluation but retain review evidence", () => {
  const result = evaluate(
    "Foldable 4K GPS camera drone",
    "Camera drone with rechargeable battery and USB charger.",
    ["drone", "battery", "charger"]
  );

  assert.equal(result.passes, true);
  assert.equal(result.status, "ENRICHED");
  assert.deepEqual(result.risk.manualReviewTerms, ["drone", "battery", "charger"]);
  assert.equal(result.risk.reviewRequired, true);
  assert.equal(result.risk.restrictedTerms, undefined);
});

test("battery terms remain a hard rejection outside an approved review-only class", () => {
  const result = evaluate(
    "Interactive dog toy with battery",
    "Rechargeable toy with USB charger."
  );

  assert.equal(result.passes, false);
  assert.deepEqual(result.risk.restrictedTerms, ["battery", "charger"]);
  assert.equal(result.risk.manualReviewTerms, undefined);
});

test("Applicable age Adult supplier metadata is not classified as adult goods", () => {
  const result = evaluate(
    "Warm fleece slippers",
    "<ul><li>Applicable age: Adult</li><li>Material: fleece</li></ul>"
  );

  assert.equal(result.passes, true);
  assert.deepEqual(result.risk, {});
});

test("adult apparel and headwear sizing is not classified as adult content", () => {
  for (const [title, description] of [
    [
      "Adult Western Cowboy Hat",
      "Wearable western headwear sized for adults with an adjustable inner band.",
    ],
    [
      "Unisex Cowboy Hats for Adults",
      "Western apparel offered in two adult hat sizes.",
    ],
    [
      "Adult Linen Shirt",
      "Lightweight clothing with standard adult sizing.",
    ],
  ]) {
    const result = evaluate(title, description);
    assert.equal(result.passes, true, title);
    assert.deepEqual(result.risk, {}, title);
  }
});

test("actual adult goods remain blocked even without the standalone adult label", () => {
  const titledAdult = evaluate("Adult novelty toy", "Private-use product.");
  const classifiedAdult = evaluate("Rechargeable personal massager", "An erotic vibrator.");
  const disguisedAsApparel = evaluate(
    "Adult novelty cowboy hat",
    "Erotic fetish headwear sold as an adult-only product."
  );

  assert.deepEqual(titledAdult.risk.restrictedTerms, ["adult"]);
  assert.deepEqual(classifiedAdult.risk.restrictedTerms, ["adult"]);
  assert.deepEqual(disguisedAsApparel.risk.restrictedTerms, ["adult"]);
});
