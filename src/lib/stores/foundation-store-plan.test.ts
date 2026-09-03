import assert from "node:assert/strict";
import test from "node:test";
import { buildFoundationStorePlan } from "./foundation-store-plan";

const INPUT = {
  niche: "camera drones",
  audience: "new creators learning aerial photography",
  brandVoice: "precise, encouraging and honest",
  locale: "nb-NO",
  country: "Norway",
};

test("foundation store planning is deterministic and catalog-free", () => {
  const first = buildFoundationStorePlan(INPUT);
  const second = buildFoundationStorePlan(INPUT);
  assert.deepEqual(first, second);
  assert.equal(first.foundation.audit.status, "PASS");
  assert.equal(first.settings.generation, null);
  assert.equal(first.settings.foundationCreation, null);
  assert.deepEqual(first.settings.automation.importKeywords, []);
  assert.equal(first.settings.automation.importDefaultSupplier, "");
  assert.equal(first.settings.personalization.enabled, false);
  assert.equal(first.settings.compliance.showDropshipDisclosure, false);
  assert.equal("providerKeys" in first, false);
  assert.equal("categories" in first, false);
  assert.equal("products" in first, false);
});

test("brand input changes the identity without changing the safety contract", () => {
  const plan = buildFoundationStorePlan({ ...INPUT, brandName: "Aerial North" });
  assert.equal(plan.brandName, "Aerial North");
  assert.equal(plan.baseSlug, "aerial-north");
  assert.equal(plan.foundation.identity.brandName, "Aerial North");
  assert.equal(plan.foundation.seoDraft.status, "DRAFT_NOINDEX");
});

test("planned domain is intent only and reserved hostnames are rejected", () => {
  const plan = buildFoundationStorePlan({ ...INPUT, plannedDomain: "aerialnorth.no" });
  assert.equal(plan.plannedDomain, "aerialnorth.no");
  assert.equal(plan.primaryDomain, "camera-drones.preview.example");
  assert.throws(
    () => buildFoundationStorePlan({ ...INPUT, plannedDomain: "preview.example" }),
    /Reserved development hostnames/
  );
  assert.throws(
    () => buildFoundationStorePlan({ ...INPUT, plannedDomain: "https://example.com/path" }),
    /bare production hostname/
  );
});

test("Norwegian foundation stores receive NOK without a commerce claim", () => {
  const plan = buildFoundationStorePlan(INPUT);
  assert.equal(plan.currency, "NOK");
  assert.match(plan.positioning, /claims remain locked pending evidence/i);
});

test("maximum valid merchant input still produces a contract-valid foundation", () => {
  const plan = buildFoundationStorePlan({
    niche: "n".repeat(160),
    audience: "a".repeat(240),
    brandVoice: "v".repeat(240),
    locale: "nb-NO",
    country: "Norway",
  });
  assert.ok(plan.brandName.length <= 80);
  assert.ok(
    plan.foundation.homepage.principles.every((principle) => principle.body.length <= 420)
  );
  assert.ok(
    plan.foundation.seoDraft.topicBriefs.every((brief) => brief.angle.length <= 360)
  );
  assert.equal(plan.foundation.audit.status, "PASS");
});
