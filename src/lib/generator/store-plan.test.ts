import assert from "node:assert/strict";
import test from "node:test";
import { checkContent } from "@/lib/ai/content-guardrails";
import type { StoreBlueprintInput } from "@/lib/ai/types";
import {
  buildClassQueryPlanV1,
  profileFromOntologyV1,
  resolveNicheIntentV1,
} from "@/lib/generator-v3";
import {
  executionRequestFingerprint,
  issueApprovedStorePlanToken,
  verifyApprovedStorePlanToken,
} from "./store-plan";

const secret = "test-only-store-plan-secret-123456";

test("approved store plan pins exact catalog and creative truth", () => {
  const input: StoreBlueprintInput = {
    niche: "fluffy slippers",
    audience: "shoppers",
    productKeywords: [],
    supplierSearchHints: [],
    negativeKeywords: [],
    categoryHints: [],
    pricePositioning: "value",
    productCountGoal: "small",
    brandVoice: "clear and honest",
    locale: "nb-NO",
    country: "Norway",
  };
  const intent = resolveNicheIntentV1(input);
  const classProfile = profileFromOntologyV1(intent.productClass)!;
  const queryPlan = buildClassQueryPlanV1(intent);
  const blueprint = {
    storeSlug: "fluffy-slippers",
    brandName: "Slipper Studio",
    tagline: "Supplier-backed slippers.",
    categories: [classProfile.category],
    homepageSections: [],
    seoTitle: "Slipper Studio",
    seoDescription: "Supplier-backed slippers.",
    guideIdeas: [],
    faqIdeas: [],
    productImportQueries: queryPlan.queries.map((entry) => entry.query),
    themeColors: {
      primary: "#000000",
      secondary: "#111111",
      accent: "#222222",
      background: "#ffffff",
      text: "#000000",
    },
    trustCopy: "Supplier facts only.",
    shippingDisclosure: "Supplier delivery estimates are shown.",
    monetizationIdeas: [],
    qualityChecklist: [],
  };
  const guardrails = checkContent({
    text: `${blueprint.tagline}\n${blueprint.shippingDisclosure}`,
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });
  const issued = issueApprovedStorePlanToken(
    {
      version: "store-plan.v1",
      input,
      classProfile,
      intent,
      queryPlan,
      blueprint,
      guardrails,
    },
    { secret, now: 1_000, ttlMs: 60_000 }
  );
  const verified = verifyApprovedStorePlanToken(issued.token, {
    secret,
    now: 30_000,
  });
  assert.equal(verified.planDigest, issued.plan.planDigest);
  assert.deepEqual(verified.blueprint, blueprint);
});

test("execution fingerprint changes when provider mode or plan changes", () => {
  const base = {
    planDigest: "a",
    importProducts: true,
    autoPublishScored: true,
    providerMode: "CONFIGURED" as const,
    providerKeys: ["cj"],
  };
  assert.notEqual(
    executionRequestFingerprint(base),
    executionRequestFingerprint({ ...base, providerMode: "SYNTHETIC_DEMO" })
  );
  assert.notEqual(
    executionRequestFingerprint(base),
    executionRequestFingerprint({
      ...base,
      importProducts: false,
      providerMode: "FOUNDATION_ONLY",
      providerKeys: [],
    })
  );
  assert.notEqual(
    executionRequestFingerprint(base),
    executionRequestFingerprint({ ...base, planDigest: "b" })
  );
  assert.notEqual(
    executionRequestFingerprint(base),
    executionRequestFingerprint({ ...base, providerKeys: ["ebay"] })
  );
});
