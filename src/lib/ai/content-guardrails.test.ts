import assert from "node:assert/strict";
import test from "node:test";
import { checkContent } from "@/lib/ai/content-guardrails";
import { generateStoreBlueprint } from "@/lib/ai/store-blueprint";

test("the built-in blueprint provider passes its own review guardrail", async () => {
  const result = await generateStoreBlueprint({
    niche: "fluffy slippers",
    targetCustomer: "people looking for comfortable indoor footwear",
  });

  assert.equal(result.guardrails.passed, true);
  assert.equal(
    result.guardrails.flags.some((flag) => flag.rule === "no-fake-reviews"),
    false
  );
});

test("truthful collected-feedback copy is allowed", () => {
  const report = checkContent({
    text: "Customer feedback is displayed only after it has been collected by this store from a completed order.",
  });

  assert.equal(report.passed, true);
});

test("unsupported review claims remain blocked", () => {
  const claims = [
    "Read our verified reviews before ordering.",
    "Thousands of five-star reviews prove this is the best choice.",
    "Our customers rate us 4.9 out of 5.",
    "Rated 4.8 / 5 stars by happy shoppers.",
  ];

  for (const text of claims) {
    const report = checkContent({ text });
    assert.equal(report.passed, false, text);
    assert.equal(
      report.flags.some(
        (flag) => flag.rule === "no-fake-reviews" && flag.severity === "BLOCK"
      ),
      true,
      text
    );
  }
});
