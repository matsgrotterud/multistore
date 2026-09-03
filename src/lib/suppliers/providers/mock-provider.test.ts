import assert from "node:assert/strict";
import test from "node:test";
import { evaluateCandidateQuality } from "../../catalog/quality-gates";
import { evaluateCandidateV1, resolveNicheIntentV1 } from "../../generator-v3";
import { MockCommerceProvider, mockCommerceProvider } from "./mock-provider";

test("slime search exposes enough synthetic demo fixtures without enabling live commerce", async () => {
  const products = await mockCommerceProvider.searchProducts({
    query: "slime toy",
    limit: 12,
  });
  const slimeFixtures = products.filter(
    (product) => product.signals.syntheticFixture === true
  );

  assert.ok(
    slimeFixtures.length >= 8,
    `Expected at least 8 slime demo fixtures, received ${slimeFixtures.length}: ${slimeFixtures
      .map((product) => product.externalId)
      .join(", ")}`
  );

  const intent = resolveNicheIntentV1({ niche: "children slimy toys" });
  assert.equal(intent.productClass, "toys.slime-kits");
  assert.equal(intent.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(intent.liveCommerceAllowed, false);

  for (const product of slimeFixtures) {
    assert.equal(product.providerKey, "mock", product.externalId);
    assert.equal(product.fulfillmentMode, "MOCK", product.externalId);
    assert.equal(product.signals.syntheticFixture, true, product.externalId);
    assert.equal(product.signals.localDemoOnly, true, product.externalId);
    assert.equal(product.signals.productionEligible, false, product.externalId);
    assert.equal(product.media.length, 3, product.externalId);
    assert.equal(
      product.media.every((media) => media.url.startsWith("https://placehold.co/")),
      true,
      product.externalId
    );

    const supplierCost = product.supplierCost ?? 0;
    const marginPercent =
      product.price && product.price > 0
        ? ((product.price - supplierCost - (product.shippingCost ?? 0)) / product.price) * 100
        : null;
    const evaluation = evaluateCandidateV1(intent, {
      title: product.title,
      description: product.description,
      specs: product.specs,
      variants: product.variants,
      providerKey: product.providerKey,
      externalId: product.externalId,
      sourceUrl: product.sourceUrl,
      usableStoredMediaCount: product.media.length,
      variantIdentityReady: true,
      price: product.price,
      marginPercent,
      shippingDaysMax: product.shippingDaysMax,
      groundedContentReady: true,
    });

    assert.equal(evaluation.relevance.state, "PASS", product.externalId);
    assert.equal(evaluation.previewVisibility.state, "PASS", product.externalId);
    assert.equal(evaluation.policy.state, "REVIEW", product.externalId);
    assert.equal(evaluation.liveCommerceEligibility.state, "FAIL", product.externalId);
  }
});

test("cowboy-hat queries receive a deterministic reconstructible local-demo catalog", async () => {
  const query = "cowboy hats adults";
  const products = await mockCommerceProvider.searchProducts({ query, limit: 12 });

  assert.ok(
    products.length >= 8,
    `Expected at least 8 generated cowboy-hat fixtures, received ${products.length}`
  );

  for (const product of products) {
    assert.match(product.title.toLowerCase(), /cowboy hats adults/);
    assert.equal(product.providerKey, "mock", product.externalId);
    assert.equal(product.fulfillmentMode, "MOCK", product.externalId);
    assert.equal(product.signals.syntheticFixture, true, product.externalId);
    assert.equal(product.signals.localDemoOnly, true, product.externalId);
    assert.equal(product.signals.productionEligible, false, product.externalId);
    assert.equal(product.signals.requiresMerchantReview, true, product.externalId);
    assert.equal(product.signals.generatedForQuery, true, product.externalId);
    assert.equal(product.media.length, 3, product.externalId);
    assert.equal(
      product.media.every((media) => media.url.startsWith("https://placehold.co/")),
      true,
      product.externalId
    );

    const quality = evaluateCandidateQuality({
      title: product.title,
      description: product.description,
      sourceUrl: product.sourceUrl,
      externalId: product.externalId,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
      mediaCount: product.media.length,
      score: 80,
      minScore: 50,
      marginPercent: 40,
      minMarginPercent: 25,
    });
    assert.equal(quality.passes, true, product.externalId);

    // A fresh provider instance proves details are reconstructed from the ID,
    // not remembered from the preceding search call.
    const details = await new MockCommerceProvider().getProductDetails({
      externalId: product.externalId,
      sourceUrl: product.sourceUrl,
    });
    assert.equal(details.title, product.title, product.externalId);
    assert.deepEqual(details.specs, product.specs, product.externalId);
    assert.deepEqual(details.signals, product.signals, product.externalId);
    assert.deepEqual(details.media, product.media, product.externalId);
  }
});
