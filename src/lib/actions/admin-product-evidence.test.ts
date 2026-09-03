import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAdminProductEditEvidence } from "./admin-product-evidence";

const longDescription = [
  "Soft indoor slippers with a plush lining and a flexible sole for everyday home use.",
  "The recorded supplier details describe a lightweight house slipper intended for dry indoor floors.",
  "Choose the available size carefully and compare the listed measurements before ordering.",
  "Delivery timing is shown on the storefront and can vary by destination and supplier processing.",
  "Review the materials, available options, shipping estimate and return policy before purchase.",
  "No local-stock, testing, certification or performance claim is made for this product.",
].join(" ");

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    store: { niche: "dog toys", launchStatus: "PREVIEW" },
    requestedPublished: true,
    supplierDataJson: JSON.stringify({
      rawTitle: "Supplier dog chew toy",
      contentFactScore: 3,
      retainedAuditField: "keep-me",
      candidateEvaluationV1: {
        version: "candidate-evaluator.v1",
        evaluatedAt: "2000-01-01T00:00:00.000Z",
        relevance: { state: "PASS" },
        previewVisibility: { state: "PASS" },
      },
    }),
    candidate: {
      title: "Interactive dog chew toy",
      description: longDescription.replace(/slippers?/gi, "dog toy"),
      specs: [{ label: "Product type", value: "Dog chew toy" }],
      visibleContentText: longDescription.replace(/slippers?/gi, "dog toy"),
      providerKey: "cj",
      externalId: "cj-dog-toy-1",
      sourceUrl: "https://supplier.example/dog-toy-1",
      usableStoredMediaCount: 2,
      variantIdentityReady: true,
      price: 39,
      marginPercent: 35,
      shippingDaysMax: 12,
      riskVeto: false,
    },
    ...overrides,
  };
}

test("a valid PREVIEW edit is evaluated from the proposed candidate", () => {
  const result = evaluateAdminProductEditEvidence(baseInput());

  assert.equal(result.saveAllowed, true);
  assert.equal(result.publicationAllowed, true);
  assert.equal(result.evaluation.relevance.state, "PASS");
  assert.equal(result.evaluation.previewVisibility.state, "PASS");
});

test("stale PASS evidence cannot publish an off-class post-edit candidate", () => {
  const input = baseInput();
  const result = evaluateAdminProductEditEvidence({
    ...input,
    candidate: {
      ...input.candidate,
      title: "Decorative wall ornament",
      description: "A decorative wall ornament and poster for a living room.",
      specs: [{ label: "Product type", value: "Wall decor" }],
      visibleContentText: `${longDescription} Decorative wall ornament and poster.`,
    },
  });

  assert.equal(result.saveAllowed, false);
  assert.equal(result.publicationAllowed, false);
  assert.equal(result.evaluation.relevance.state, "FAIL");
  assert.ok(result.publicationReasonCodes.includes("RELEVANCE_NOT_PASS"));
});

test("saving an invalid product as unpublished replaces stale evaluation", () => {
  const input = baseInput({ requestedPublished: false });
  const result = evaluateAdminProductEditEvidence({
    ...input,
    candidate: {
      ...input.candidate,
      title: "Decorative wall ornament",
      description: "A decorative wall ornament and poster for a living room.",
      specs: [{ label: "Product type", value: "Wall decor" }],
      visibleContentText: `${longDescription} Decorative wall ornament and poster.`,
    },
  });
  const persisted = result.nextSupplierData.candidateEvaluationV1 as {
    evaluatedAt: string;
    relevance: { state: string };
  };

  assert.equal(result.saveAllowed, true);
  assert.equal(result.publicationAllowed, false);
  assert.equal(persisted.relevance.state, "FAIL");
  assert.notEqual(persisted.evaluatedAt, "2000-01-01T00:00:00.000Z");
  assert.equal(result.nextSupplierData.retainedAuditField, "keep-me");
});

test("PREVIEW permits review-only policy but LIVE requires live policy and commerce PASS", () => {
  const previewInput = baseInput({
    store: { niche: "fluffy slippers", launchStatus: "PREVIEW" },
  });
  const preview = evaluateAdminProductEditEvidence({
    ...previewInput,
    candidate: {
      ...previewInput.candidate,
      title: "Warm fluffy house slippers",
      description: longDescription,
      specs: [{ label: "Product type", value: "House slippers" }],
      visibleContentText: longDescription,
    },
  });
  const live = evaluateAdminProductEditEvidence({
    ...previewInput,
    store: { niche: "fluffy slippers", launchStatus: "LIVE" },
    candidate: {
      ...previewInput.candidate,
      title: "Warm fluffy house slippers",
      description: longDescription,
      specs: [{ label: "Product type", value: "House slippers" }],
      visibleContentText: longDescription,
    },
  });

  assert.equal(preview.evaluation.policy.state, "REVIEW");
  assert.equal(preview.publicationAllowed, true);
  assert.equal(live.publicationAllowed, false);
  assert.ok(live.publicationReasonCodes.includes("POLICY_NOT_LIVE_APPROVED"));
  assert.ok(live.publicationReasonCodes.includes("LIVE_COMMERCE_NOT_PASS"));
});

test("missing durable media fails the fresh preview publication gate", () => {
  const input = baseInput();
  const result = evaluateAdminProductEditEvidence({
    ...input,
    candidate: { ...input.candidate, usableStoredMediaCount: 0 },
  });

  assert.equal(result.publicationAllowed, false);
  assert.ok(result.publicationReasonCodes.includes("MEDIA_STORED_USABLE_MISSING"));
  assert.equal(result.evaluation.mediaReadiness.state, "FAIL");
});

test("fresh content guardrails block fabricated claims despite stale PASS evidence", () => {
  const input = baseInput();
  const result = evaluateAdminProductEditEvidence({
    ...input,
    candidate: {
      ...input.candidate,
      visibleContentText: `${input.candidate.visibleContentText} Award-winning and clinically proven.`,
    },
  });

  assert.equal(result.publicationAllowed, false);
  assert.ok(result.publicationReasonCodes.includes("GROUNDED_CONTENT_NOT_READY"));
  assert.ok(
    (result.nextSupplierData.guardrailFlags as string[]).includes(
      "BLOCK:no-unverifiable-claims"
    )
  );
});
