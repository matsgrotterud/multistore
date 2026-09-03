import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClassQueryPlanV1,
  buildGenerationResultV1,
  evaluateCandidateV1,
  resolveNicheIntentV1,
} from "./index";

const readyFacts = {
  providerKey: "cj",
  externalId: "p-1",
  usableStoredMediaCount: 2,
  variantIdentityReady: true,
  price: 29,
  marginPercent: 35,
  shippingDaysMax: 12,
  groundedContentReady: true,
};

test("fluffy slippers resolves class-first with manual review policy", () => {
  const intent = resolveNicheIntentV1({ niche: "fluffy slippers" });
  assert.equal(intent.productClass, "footwear.slippers");
  assert.equal(intent.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(intent.liveCommerceAllowed, false);
  assert.equal(intent.qualifiers.includes("fluffy"), true);
  const plan = buildClassQueryPlanV1(intent);
  assert.ok(plan.queries.length > 0);
  assert.equal(plan.queries.some((entry) => /^fluffy$/i.test(entry.query)), false);
  assert.equal(plan.queries.some((entry) => /slipper|house shoe/.test(entry.query)), true);
});

test("slippers pass class evidence but merchandising words alone never pass", () => {
  const intent = resolveNicheIntentV1({ niche: "fluffy slippers" });
  const positive = evaluateCandidateV1(intent, {
    title: "Women's Plush House Slippers",
    description: "Warm indoor slipper with memory foam",
    ...readyFacts,
  });
  assert.equal(positive.relevance.state, "PASS");
  assert.equal(positive.previewVisibility.state, "PASS");
  assert.equal(positive.liveCommerceEligibility.state, "FAIL");

  for (const word of ["premium", "featured", "everyday", "pick", "accessories", "fluffy", "warm"]) {
    const negative = evaluateCandidateV1(intent, {
      title: `${word} seasonal selection`,
      description: `Our ${word} product`,
      ...readyFacts,
    });
    assert.equal(negative.relevance.state, "FAIL", word);
  }
});

test("slipper evaluator rejects known junk product classes", () => {
  const intent = resolveNicheIntentV1({ niche: "fluffy slippers" });
  const junk = [
    "Artificial sunflower wall decor",
    "Christmas plush dollhouse miniature",
    "Women's sneaker keychain",
    "Running shoe outdoor trainer",
  ];
  for (const title of junk) {
    assert.equal(evaluateCandidateV1(intent, { title, ...readyFacts }).relevance.state, "FAIL", title);
  }
});

test("all required fluffy-slipper fixtures pass and all known incident fixtures fail", () => {
  const intent = resolveNicheIntentV1({ niche: "fluffy slippers" });
  const positives = [
    "Fluffy Slippers Female Winter Wear",
    "3D Cat Paw Plush Slippers Flat Thermal Winter Slippers",
    "Cute Cat Slippers Fluffy Furry Women Home Platform Slippers",
    "Warm Winter Plush Slippers Women Non-slip Thick-soled Fluffy Slippers",
    "New Winter Cosy Warm Couple Style Fluffy Slippers",
    "Fluffy Slipper Fall Winter Warm Home Fur Furry Slippers",
  ];
  const negatives = [
    "Cocktail picks",
    "Creative Egg Shell Cooking Hotel Featured Abnormal-shape Bowl",
    "JSK Lolita Everyday Cute Lolita Dress",
    "Premium metal luxury fountain pen",
    "Geometric Square Zircon Bracelet Elegant Sparkling Women",
    "Women's Solid Color Short Sleeve Dress Casual Crew Neck Everyday Wear",
    "Fashion Jewelry Rhinestone Butterflies Stud Earrings",
    "Girls hair accessories set",
    "Nylon Watchband Watch Accessories Men",
    "Ladies Small Dial Mini Premium Bracelet",
    "Retro Hepburn Style Premium Zipper Dress",
    "Creative 3D Inner Carving Luminous Crystal Ball",
  ];
  for (const title of positives) {
    assert.equal(
      evaluateCandidateV1(intent, { title, ...readyFacts }).relevance.state,
      "PASS",
      title
    );
  }
  for (const title of negatives) {
    assert.equal(
      evaluateCandidateV1(intent, { title, ...readyFacts }).relevance.state,
      "FAIL",
      title
    );
  }
});

test("dog, fishing and shoes regressions are class-specific", () => {
  const dog = resolveNicheIntentV1({ niche: "dog treat puzzle toys" });
  assert.equal(evaluateCandidateV1(dog, { title: "Interactive dog puzzle toy", ...readyFacts }).relevance.state, "PASS");
  assert.equal(evaluateCandidateV1(dog, { title: "Trick or treat Halloween wall decor", ...readyFacts }).relevance.state, "FAIL");
  assert.equal(evaluateCandidateV1(dog, { title: "Catnip cat wand toy", ...readyFacts }).relevance.state, "FAIL");

  const fishing = resolveNicheIntentV1({ niche: "fishing lures and bait" });
  assert.equal(evaluateCandidateV1(fishing, { title: "Soft fishing lure bait", ...readyFacts }).relevance.state, "PASS");
  assert.equal(evaluateCandidateV1(fishing, { title: "Drywall wall hook set", ...readyFacts }).relevance.state, "FAIL");
  assert.equal(evaluateCandidateV1(fishing, { title: "Aquarium fish tank filter", ...readyFacts }).relevance.state, "FAIL");

  const shoes = resolveNicheIntentV1({ niche: "green running shoes" });
  assert.equal(evaluateCandidateV1(shoes, { title: "Green running shoes", ...readyFacts }).relevance.state, "PASS");
  assert.equal(evaluateCandidateV1(shoes, { title: "Mini doll shoes keychain", ...readyFacts }).relevance.state, "FAIL");
});

test("drone resolves to a reviewed camera-drone class and excludes accessories", () => {
  for (const niche of ["drone", "camera drones", "droner"]) {
    const intent = resolveNicheIntentV1({ niche });
    assert.equal(intent.productClass, "electronics.camera-drones", niche);
    assert.equal(intent.policyDecision, "MANUAL_REVIEW_REQUIRED", niche);
    assert.equal(intent.liveCommerceAllowed, false, niche);
    assert.equal(intent.autonomousLaunchAllowed, false, niche);
    assert.ok(buildClassQueryPlanV1(intent).queries.length > 0, niche);

    const product = evaluateCandidateV1(intent, {
      title: "Foldable GPS 4K Camera Drone",
      description: "A compact quadcopter drone with camera.",
      ...readyFacts,
    });
    assert.equal(product.relevance.state, "PASS", niche);
    assert.equal(product.previewVisibility.state, "PASS", niche);
    assert.equal(product.liveCommerceEligibility.state, "FAIL", niche);

    for (const title of [
      "Replacement drone battery pack",
      "Drone propeller replacement set",
      "Portable drone landing pad",
      "4K action camera gimbal",
      "Mini toy drone for kids",
      "USB Fast Charger Compatible with DJI Camera Drones",
      "Replacement Battery for Foldable Camera Drone",
      "Protective Carry Case for 4K Camera Drone",
    ]) {
      assert.equal(
        evaluateCandidateV1(intent, { title, ...readyFacts }).relevance.state,
        "FAIL",
        title
      );
    }
    assert.equal(
      evaluateCandidateV1(intent, {
        title: "Foldable 4K Camera Drone with Extra Battery and Charger",
        ...readyFacts,
      }).relevance.state,
      "PASS"
    );
    for (const accessory of [
      {
        title: "DJI Mini 4 Pro Intelligent Flight Battery",
        description: "Replacement battery compatible with a foldable camera drone.",
      },
      {
        title: "65W USB Fast Charger",
        description: "Designed for DJI camera drones and quadcopters.",
      },
      {
        title: "Waterproof Protective Carry Case",
        description: "Storage bag for a 4K camera drone.",
      },
    ]) {
      assert.equal(
        evaluateCandidateV1(intent, {
          ...accessory,
          ...readyFacts,
        }).relevance.state,
        "FAIL",
        accessory.title
      );
    }
  }
});

test("children slimy toys resolves to safety-reviewed slime kits", () => {
  const intent = resolveNicheIntentV1({ niche: "children slimy toys" });
  assert.equal(intent.productClass, "toys.slime-kits");
  assert.equal(intent.policyDecision, "MANUAL_REVIEW_REQUIRED");
  assert.equal(intent.liveCommerceAllowed, false);
  assert.equal(intent.riskFlags.includes("TOY_SAFETY"), true);
  assert.equal(intent.riskFlags.includes("CHEMICAL_COMPOSITION"), true);

  const plan = buildClassQueryPlanV1(intent);
  assert.ok(plan.queries.length > 0);
  assert.equal(plan.queries.some((entry) => /slime (?:toy|kit)/i.test(entry.query)), true);
});

test("slime-kit evidence passes while cleaning, automotive and edible slime fail", () => {
  const intent = resolveNicheIntentV1({ niche: "children slimy toys" });
  const relevant = [
    "DIY Slime Making Kit for Kids",
    "Fluffy Slime Toy Set",
    "Sensory Slime Kit with Storage Tubs",
  ];
  const irrelevant = [
    "Keyboard Cleaner Cleaning Slime Gel",
    "Car Cleaning Gel for Dashboard Dust Removal",
    "Tubeless Tire Sealant Puncture Repair Slime",
    "Edible Slime Candy Party Pack",
    "Slime Charm Keychain",
  ];

  for (const title of relevant) {
    const evaluation = evaluateCandidateV1(intent, { title, ...readyFacts });
    assert.equal(evaluation.relevance.state, "PASS", title);
    assert.equal(evaluation.previewVisibility.state, "PASS", title);
    assert.equal(evaluation.liveCommerceEligibility.state, "FAIL", title);
  }
  for (const title of irrelevant) {
    assert.equal(
      evaluateCandidateV1(intent, { title, ...readyFacts }).relevance.state,
      "FAIL",
      title
    );
  }
});

test("unknown niche fails closed without generic queries", () => {
  const intent = resolveNicheIntentV1({ niche: "quantum lifestyle essentials" });
  assert.equal(intent.productClass, null);
  assert.equal(intent.reasonCodes.includes("INSUFFICIENT_INTENT_EVIDENCE"), true);
  assert.deepEqual(buildClassQueryPlanV1(intent).queries, []);
  assert.equal(evaluateCandidateV1(intent, { title: "Featured pick", ...readyFacts }).relevance.state, "UNKNOWN");
});

test("generation result is discriminated, exact-budget and honest", () => {
  const slippers = resolveNicheIntentV1({ niche: "fluffy slippers" });
  assert.equal(
    buildGenerationResultV1({
      intent: slippers,
      minimumProducts: 6,
      relevantProducts: 8,
      previewVisibleProducts: 8,
      importedProducts: 8,
      importBudget: 8,
    }).status,
    "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW"
  );
  assert.equal(
    buildGenerationResultV1({
      intent: slippers,
      minimumProducts: 6,
      relevantProducts: 2,
      previewVisibleProducts: 2,
      importedProducts: 2,
      importBudget: 8,
    }).status,
    "INSUFFICIENT_RELEVANT_PRODUCTS"
  );
  assert.equal(
    buildGenerationResultV1({
      intent: slippers,
      minimumProducts: 6,
      relevantProducts: 9,
      previewVisibleProducts: 9,
      importedProducts: 9,
      importBudget: 8,
    }).status,
    "VALIDATION_FAILED"
  );
});
