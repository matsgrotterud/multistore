export interface ProductOntologyEntryV1 {
  productClass: string;
  headNoun: string;
  nichePatterns: RegExp[];
  classConcepts: string[];
  qualifiers: string[];
  excludedClasses: Array<{ className: string; concepts: string[] }>;
  policy: "ALLOW" | "MANUAL_REVIEW_REQUIRED";
  riskFlags: string[];
  category: { slug: string; name: string; description: string };
}

const COMMON_EXCLUDED = [
  { className: "decor", concepts: ["wall decor", "ornament", "decoration", "poster", "figurine"] },
  { className: "keychain", concepts: ["keychain", "key ring", "keyring"] },
  { className: "doll", concepts: ["doll", "dollhouse", "miniature"] },
];

export const PRODUCT_ONTOLOGY_V1: ProductOntologyEntryV1[] = [
  {
    productClass: "electronics.camera-drones",
    headNoun: "camera drones",
    nichePatterns: [
      /\bdrones?\b/i,
      /\bquadcopter(s)?\b/i,
      /\bdroner?\b/i,
    ],
    classConcepts: [
      "camera drone",
      "camera drones",
      "gps drone",
      "foldable drone",
      "4k drone",
      "fpv drone",
      "quadcopter drone",
      "drone",
      "drones",
    ],
    qualifiers: ["camera", "gps", "foldable", "4k", "fpv", "beginner"],
    excludedClasses: [
      ...COMMON_EXCLUDED,
      {
        className: "drone-accessories",
        concepts: [
          "drone battery",
          "drone batteries",
          "drone charger",
          "drone propeller",
          "drone propellers",
          "drone case",
          "drone bag",
          "landing pad",
          "remote controller",
          "replacement arm",
          "motor replacement",
        ],
      },
      {
        className: "toy-only-drones",
        concepts: ["toy drone", "kids drone", "children drone"],
      },
      {
        className: "unrelated-cameras",
        concepts: ["security camera", "dash camera", "action camera", "camera gimbal"],
      },
    ],
    policy: "MANUAL_REVIEW_REQUIRED",
    riskFlags: [
      "AVIATION_RULES",
      "BATTERY_TRANSPORT",
      "CAMERA_PRIVACY",
      "RADIO_COMPLIANCE",
      "REGIONAL_PRODUCT_COMPLIANCE",
    ],
    category: {
      slug: "camera-drones",
      name: "Camera drones",
      description:
        "Camera drones that passed catalog relevance checks. Merchant safety, battery, radio and regional compliance review is required before sale.",
    },
  },
  {
    productClass: "footwear.slippers",
    headNoun: "slippers",
    nichePatterns: [/\bslippers?\b/i, /\bhouse shoes?\b/i, /\bindoor shoes?\b/i],
    classConcepts: ["slipper", "slippers", "house slipper", "house slippers", "house shoe", "house shoes", "indoor slipper", "indoor slippers", "slipper slide", "slipper slides"],
    qualifiers: ["fluffy", "plush", "fuzzy", "warm", "indoor"],
    excludedClasses: [
      ...COMMON_EXCLUDED,
      { className: "outdoor-shoes", concepts: ["sneaker", "running shoe", "hiking boot", "football boot"] },
      { className: "toy-footwear", concepts: ["doll shoe", "toy shoe", "mini shoe"] },
    ],
    policy: "MANUAL_REVIEW_REQUIRED",
    riskFlags: ["FOOTWEAR_FIT", "SIZE_VARIANT", "RETURN_RATE"],
    category: { slug: "all-slippers", name: "All slippers", description: "Slippers and house shoes that passed the catalog relevance checks." },
  },
  {
    productClass: "pet.dog-toys",
    headNoun: "dog toys",
    nichePatterns: [/\bdog\b.*\btoy|\btoy\b.*\bdog|\bdog toys?\b/i],
    classConcepts: ["dog toy", "dog toys", "puppy toy", "puppy toys", "dog chew toy", "dog puzzle toy", "dog enrichment toy", "dog treat dispenser"],
    qualifiers: ["chew", "puzzle", "plush", "rope", "interactive", "treat"],
    excludedClasses: [
      ...COMMON_EXCLUDED,
      { className: "cat-products", concepts: ["cat toy", "catnip", "cat wand", "cat scratcher"] },
      { className: "seasonal-decor", concepts: ["halloween", "trick or treat", "christmas ornament"] },
    ],
    policy: "ALLOW",
    riskFlags: [],
    category: { slug: "dog-toys", name: "Dog toys", description: "Dog toys that passed the catalog relevance checks." },
  },
  {
    productClass: "toys.slime-kits",
    headNoun: "slime kits",
    nichePatterns: [
      /\b(?:slime|slimy)\b.*\b(?:toy|toys|kit|kits|sensory|play)\b/i,
      /\b(?:toy|toys|kit|kits|sensory|play|kid|kids|child|children)\b.*\b(?:slime|slimy)\b/i,
    ],
    classConcepts: [
      "slime toy",
      "slime toys",
      "slime kit",
      "slime kits",
      "slime making kit",
      "diy slime kit",
      "kids slime kit",
      "sensory slime",
    ],
    qualifiers: ["fluffy", "diy", "sensory", "glitter", "cloud"],
    excludedClasses: [
      ...COMMON_EXCLUDED,
      {
        className: "cleaning-products",
        concepts: [
          "cleaning slime",
          "cleaning gel",
          "keyboard cleaner",
          "car cleaning gel",
          "dust removal gel",
        ],
      },
      {
        className: "automotive-sealants",
        concepts: ["tire sealant", "tyre sealant", "puncture repair", "tubeless sealant"],
      },
      {
        className: "food-and-cosmetics",
        concepts: ["edible slime", "slime candy", "face mask", "skin care", "slime cleanser"],
      },
    ],
    policy: "MANUAL_REVIEW_REQUIRED",
    riskFlags: [
      "CHILDREN_PRODUCT",
      "TOY_SAFETY",
      "CHEMICAL_COMPOSITION",
      "AGE_LABELING",
      "INGESTION_RISK",
    ],
    category: {
      slug: "slime-kits-and-sensory-play",
      name: "Slime kits & sensory play",
      description:
        "Slime toys and making kits that passed catalog relevance checks. Merchant safety review is required before sale.",
    },
  },
  {
    productClass: "fishing.lures-bait",
    headNoun: "fishing lures",
    nichePatterns: [/\b(fishing|angler|angling|lure|lures|bait|tackle)\b/i],
    classConcepts: ["fishing lure", "fishing lures", "fish bait", "soft bait", "hard lure", "spoon lure", "fishing tackle", "carp rig", "fishing hook"],
    qualifiers: ["soft", "hard", "carp", "bass", "trout", "saltwater", "freshwater"],
    excludedClasses: [
      ...COMMON_EXCLUDED,
      { className: "hardware-hooks", concepts: ["drywall hook", "wall hook", "towel hook", "coat hook", "ceiling hook"] },
      { className: "aquarium", concepts: ["aquarium", "fish tank", "aquarium filter", "aquarium decoration"] },
    ],
    policy: "ALLOW",
    riskFlags: ["SHARP_COMPONENT"],
    category: { slug: "fishing-lures-and-bait", name: "Fishing lures & bait", description: "Lures, bait and rigs that passed the fishing relevance checks." },
  },
  {
    productClass: "footwear.shoes",
    headNoun: "shoes",
    nichePatterns: [/\b(shoe|shoes|sneaker|sneakers|footwear|trainer|trainers)\b/i],
    classConcepts: ["shoe", "shoes", "sneaker", "sneakers", "running shoe", "running shoes", "trainer", "trainers", "footwear"],
    qualifiers: ["green", "running", "casual", "trail", "walking"],
    excludedClasses: [
      ...COMMON_EXCLUDED,
      { className: "toy-footwear", concepts: ["doll shoe", "toy shoe", "mini shoe", "shoe keychain"] },
    ],
    policy: "MANUAL_REVIEW_REQUIRED",
    riskFlags: ["FOOTWEAR_FIT", "SIZE_VARIANT", "RETURN_RATE"],
    category: { slug: "all-shoes", name: "All shoes", description: "Shoes that passed the catalog relevance checks." },
  },
];

export function ontologyEntryForClass(productClass: string | null) {
  return PRODUCT_ONTOLOGY_V1.find((entry) => entry.productClass === productClass) ?? null;
}
