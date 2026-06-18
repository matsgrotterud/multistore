import {
  buildCategoryImportQueries,
  buildRelevanceProfile,
  deriveNegativeKeywords,
  evaluateRelevance,
} from "@/lib/ai/category-strategy";

/**
 * Deterministic, offline assertions for Generator V2 supplier relevance.
 * Run: pnpm run relevance:test
 */

let failures = 0;
function assert(label: string, condition: boolean) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}`);
  }
}

function relevant(niche: string, title: string, description = ""): boolean {
  const profile = buildRelevanceProfile({ niche });
  const negatives = deriveNegativeKeywords({ niche });
  return evaluateRelevance(profile, title, description, negatives).relevant;
}

console.log("\n[dog niche: vegan dog toys] — must REJECT mismatches");
assert("reject cat collar", !relevant("vegan dog toys", "Naughty Cat Collar Pet Trick Or Treat Pumpkin Collar"));
assert("reject halloween wall ornament", !relevant("vegan dog toys", "Halloween Resin Ornaments Trick Or Treat Ghost Wall Decoration"));
assert("reject generic doll plush", !relevant("vegan dog toys", "Devil Frog Doll Plush Toys"));
console.log("[dog niche] — must ACCEPT real dog toys");
assert("accept squeaky chew dog toy", relevant("vegan dog toys", "Interactive Dog Toys For Aggressive Chewers Dog Squeaky Toys Pet"));
assert("accept dog treat dispenser", relevant("vegan dog toys", "Adjustable Treat Dispenser Toy For Dogs Interactive IQ"));
assert("accept dog chew toy", relevant("vegan dog toys", "Giraffe Bite Resistant Pet Dog Chew Toys For Small Dogs"));
assert("accept dog plush doll (context rescue)", relevant("vegan dog toys", "Plush Dog Doll Squeaky Toy For Puppy"));

console.log("\n[fishing niche: fish bait] — must REJECT non-fishing");
assert("reject shoes", !relevant("fish bait", "Green Running Shoes Sneakers"));
assert("reject aquarium decor", !relevant("fish bait", "Aquarium Decoration Resin Ornament"));
assert("reject doll toy", !relevant("fish bait", "Kids Plush Doll Toy"));
console.log("[fishing niche] — must ACCEPT tackle");
assert("accept soft lure", relevant("fish bait", "Soft Fishing Lure Bait Set Bass"));
assert("accept carp rig", relevant("fish bait", "Carp Fishing Hook Rig Tackle"));

console.log("\n[footwear niche: green shoes] — must REJECT non-footwear");
assert("reject toy keychain", !relevant("green shoes", "Mini Toy Car Keychain"));
assert("reject figurine ornament", !relevant("green shoes", "Resin Figurine Ornament Decor"));
console.log("[footwear niche] — must ACCEPT shoes");
assert("accept running sneakers", relevant("green shoes", "Sustainable Running Sneakers Trail Shoes"));

console.log("\n[query refinement: dog Treat Puzzles]");
const dogTreatQueries = buildCategoryImportQueries({ niche: "vegan dog toys" }, "Treat Puzzles");
console.log(`  queries: ${dogTreatQueries.join(" · ")}`);
assert("includes 'dog treat dispenser toy'", dogTreatQueries.includes("dog treat dispenser toy"));
assert("includes 'dog puzzle feeder'", dogTreatQueries.includes("dog puzzle feeder"));
assert("no bare 'Treat Puzzles'", !dogTreatQueries.some((q) => q.toLowerCase() === "treat puzzles"));

console.log("\n[cross-species: dog niche treats 'cat' as conditional, not hard]");
// Supplier dog products routinely mention "cat" in dual-species descriptions.
// These must be KEPT; only cat-ONLY items (no dog evidence) are rejected.
assert(
  "accept dog toy whose description mentions cats",
  relevant("vegan dog toys", "Durable Dog Chew Rope Toy", "Great pet toy suitable for both dogs and cats.")
);
assert(
  "accept dog/cat dual feeder (has dog evidence)",
  relevant("vegan dog toys", "Dog Cat Slow Feeding Ball Food Leakage Toy")
);
assert(
  "reject cat-only product (no dog evidence)",
  !relevant("vegan dog toys", "Cat Scratcher Post Catnip Kitten Toy")
);

console.log("\n[negative keywords: dog niche]");
const dogNeg = deriveNegativeKeywords({ niche: "vegan dog toys" });
console.log(`  negatives: ${dogNeg.join(", ")}`);
assert("dog negatives exclude bare 'cat' (now conditional)", !dogNeg.includes("cat"));
assert("dog negatives include 'ornament'", dogNeg.includes("ornament"));

console.log("\n[generic niche stays loose: ergonomic office chairs]");
assert(
  "generic niche does not require positive vertical evidence",
  buildRelevanceProfile({ niche: "ergonomic office chairs" }).requirePositive === false
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll relevance assertions passed.");
