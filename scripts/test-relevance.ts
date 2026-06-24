import {
  buildCategoryImportQueries,
  buildRelevanceProfile,
  evaluateRelevance,
  type RelevanceProfile,
} from "@/lib/ai/category-strategy";

/**
 * Deterministic, offline assertions for the generalized evidence-based candidate
 * relevance gate. Run: pnpm run relevance:test
 *
 * dog toys / fish bait / green shoes are used only as TEST FIXTURES — the
 * production logic is data-driven from the store plan, not per-niche blacklists.
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

function accept(profile: RelevanceProfile, title: string, description = ""): boolean {
  return evaluateRelevance(profile, title, description, []).relevant;
}
function reject(profile: RelevanceProfile, title: string, description = ""): boolean {
  return !evaluateRelevance(profile, title, description, []).relevant;
}

/* ---------------------------- dog toys ---------------------------- */
const dog = buildRelevanceProfile({
  niche: "vegan dog toys",
  endUser: "dogs",
  supplierSearchHints: ["dog chew toy", "dog treat dispenser", "dog puzzle feeder", "squeaky dog toy", "rope dog toy"],
  negativeKeywords: ["cat collar", "kitten", "halloween decoration"],
});
console.log("\n[dog toys]");
assert("accept squeaky chew dog toy", accept(dog, "Interactive Dog Toys For Aggressive Chewers Dog Squeaky Toys"));
assert("accept dog toy whose description mentions cats", accept(dog, "Durable Dog Chew Rope Toy", "Great pet toy suitable for both dogs and cats."));
assert("accept dog/cat dual feeder with strong dog evidence", accept(dog, "Dog Cat Slow Feeding Ball Food Leakage Toy"));
assert("reject cat collar with no dog evidence", reject(dog, "Naughty Cat Collar Pet Trick Or Treat Pumpkin Collar"));
assert("reject halloween ornament/decor", reject(dog, "Halloween Resin Ornaments Trick Or Treat Ghost Wall Decoration"));
assert("reject generic doll (no dog evidence)", reject(dog, "Devil Frog Doll Plush Toys"));
assert("accept dog plush doll (dog context rescue)", accept(dog, "Plush Dog Doll Squeaky Toy For Puppy"));

/* ---------------------------- fish bait ---------------------------- */
const fish = buildRelevanceProfile({
  niche: "fish bait",
  endUser: "anglers",
  supplierSearchHints: ["soft fishing bait", "hard fishing lure", "bass lure", "fishing rig", "fishing hook", "tackle box"],
  categoryHints: ["Soft Baits", "Hard Lures", "Hooks & Rigs", "Lines & Leaders", "Tackle Storage"],
  negativeKeywords: ["aquarium decoration", "toy fish"],
});
console.log("\n[fish bait]");
assert("accept fishing lure", accept(fish, "Soft Fishing Lure Bait Set Bass Swimbait"));
assert("accept soft fishing bait", accept(fish, "Soft Plastic Fishing Bait Worm Lure"));
assert("accept fishing hook with fishing context", accept(fish, "Fishing Hook Set Treble Hooks Saltwater Sharp"));
assert("reject drywall hooks", reject(fish, "Hook 100 Pieces Set For Drywall, Plywood And Wood Hooks"));
assert("reject s-hooks / generic hardware hooks", reject(fish, "4 Rubber S-hooks Heavy Duty"));
assert("reject towel rack hooks", reject(fish, "Stainless Steel Hooks Suit Bath Towel Rack"));
assert("reject fish tank filter / aquarium media", reject(fish, "Fish Tank Filter Material Aquarium Bio Media"));
assert("reject aquarium decoration", reject(fish, "Aquarium Decoration Resin Ornament Castle"));

/* ---------------------------- green shoes ---------------------------- */
const shoes = buildRelevanceProfile({
  niche: "green shoes",
  supplierSearchHints: ["green sneakers", "sustainable shoes", "running shoes", "trail shoes"],
});
console.log("\n[green shoes]");
assert("accept running / trail sneakers", accept(shoes, "Sustainable Running Sneakers Trail Shoes Breathable"));
assert("accept eco trail running shoes", accept(shoes, "Eco Trail Running Shoes Mens"));
assert("reject toy shoes", reject(shoes, "Plastic Toy Shoes Play Set For Kids"));
assert("reject doll shoes", reject(shoes, "Fashion Doll Shoes Accessories"));
assert("reject shoe keychain", reject(shoes, "Cute Mini Shoe Keychain Pendant"));
assert("reject miniature shoes figurine", reject(shoes, "Miniature Shoes Figurine Ornament Decor"));

/* -------------------- generic: one weak token is not enough -------------------- */
console.log("\n[evidence threshold]");
assert("one generic token alone is insufficient", reject(fish, "Rubber Ball Small"));
assert("a single specific niche token is sufficient", accept(fish, "Telescopic Fishing Rod"));
const chairs = buildRelevanceProfile({ niche: "ergonomic office chairs" });
assert("data-driven niche accepts on-niche product", accept(chairs, "Ergonomic Mesh Office Chair Lumbar Support"));
assert("data-driven niche rejects unrelated weak token", reject(chairs, "Stainless Steel Spoon Set"));

/* ---------------------------- query refinement ---------------------------- */
console.log("\n[query refinement: dog Treat Puzzles]");
const dogTreatQueries = buildCategoryImportQueries({ niche: "vegan dog toys" }, "Treat Puzzles");
console.log(`  queries: ${dogTreatQueries.join(" · ")}`);
assert("includes 'dog treat dispenser toy'", dogTreatQueries.includes("dog treat dispenser toy"));
assert("includes 'dog puzzle feeder'", dogTreatQueries.includes("dog puzzle feeder"));
assert("no bare 'Treat Puzzles'", !dogTreatQueries.some((q) => q.toLowerCase() === "treat puzzles"));

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll relevance assertions passed.");
