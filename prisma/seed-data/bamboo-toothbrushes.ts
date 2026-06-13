import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Bamboo toothbrush store: calm, sustainable, subscription-friendly brand. */

const info: SeedStoreInfo = {
  slug: "bamboo-toothbrushes",
  name: "Bamboo Smile",
  legalName: "Bamboo Smile Commerce ApS",
  primaryDomain: "bambussmil.example",
  locale: "en-US",
  currency: "USD",
  niche: "sustainable oral care",
  positioning:
    "Plastic-free oral care that holds up to daily use. We are honest about what bamboo can and cannot do — the bristles are still nylon on most models, and we say so — and we make switching easy with refills on a schedule you control.",
  audience: "households reducing everyday plastic waste",
  valueProposition: "A calmer, plastic-free morning routine",
  brandVoice: "calm, warm, honest, sustainability-minded",
  logoText: "bamboo smile",
  supportEmail: "hello@bambussmil.example",
  supportPhone: null,
  shippingOriginDisclosure:
    "Orders ship from our partner suppliers' facilities in Asia in plastic-free packaging. We do not hold local stock; we publish the real delivery window on every product and offer scheduled refills so you never run out.",
  defaultShippingDaysMin: 5,
  defaultShippingDaysMax: 12,
  returnPolicySummary:
    "Unopened products return free within 30 days; for hygiene reasons opened brushes cannot be returned, but we refund any defective item without requiring a return.",
};

export const bambooSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#15803d",
    secondaryColor: "#1a2e22",
    accentColor: "#d97706",
    backgroundColor: "#fafdf7",
    textColor: "#1c2a21",
    borderRadius: "1rem",
    fontHeading: "humanist",
    fontBody: "humanist",
  },
  domains: ["bambussmil.example", "www.bambussmil.example"],
  categories: [
    {
      slug: "adult-brushes",
      name: "Adult Brushes",
      description:
        "Moso bamboo handles with BPA-free bristles in soft and medium. We label bristle material honestly: most are nylon-6 (recyclable, not compostable); our castor-oil bioblend option is clearly marked.",
      seoTitle: "Bamboo Toothbrushes for Adults — Soft & Medium | Bamboo Smile",
      seoDescription:
        "Adult bamboo toothbrushes with honest material labeling: moso bamboo handles, BPA-free soft or medium bristles, plastic-free packaging.",
      heroTitle: "Adult brushes, honestly labeled",
      heroSubtitle:
        "Compostable handles, clearly labeled bristles — and the truth about which parts are recyclable versus compostable.",
      sortOrder: 1,
      products: [
        {
          slug: "classic-soft-4-pack",
          title: "Classic Bamboo Toothbrush 4-Pack, Soft",
          subtitle: "A season of brushing for one person — or a month for the family",
          description:
            "Our standard brush: a smooth moso bamboo handle that stays comfortable when wet, with soft BPA-free nylon-6 bristles dentists generally recommend for everyday brushing.\n\nDentists advise replacing your brush every three months, so a 4-pack covers one person for a year — or a family of four for a season. The honest detail most shops skip: bamboo handles are home-compostable, but nylon bristles must be pulled out (pliers work) and binned before composting.",
          shortDescription:
            "Four soft bamboo toothbrushes with BPA-free nylon bristles and compostable moso handles, in plastic-free packaging.",
          brand: "Bamboo Smile",
          sku: "BAM-CL4S",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.4,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1101",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Soft bristles suit most gums, per general dental guidance",
            "Handle is home-compostable after bristle removal",
            "Plastic-free paper packaging",
            "A year of brushing for one person in one order",
          ],
          cons: [
            "Nylon bristles are not compostable — remove before composting the handle",
            "Bamboo handles need to dry upright to stay mold-free",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes" },
            { label: "Bristles", value: "Soft, BPA-free nylon-6" },
            { label: "Handle", value: "Moso bamboo, water-resistant finish" },
            { label: "Packaging", value: "Recycled kraft paper, no plastic" },
            { label: "Replace every", value: "~3 months (dental guidance)" },
          ],
          useCases: ["adult", "soft", "multipack", "eco", "zero-waste"],
          faq: [
            {
              question: "Are the bristles compostable?",
              answer:
                "No — they are BPA-free nylon-6. Pull them out with pliers and bin them, then home-compost the bamboo handle. We label this honestly because 'fully compostable' claims about nylon-bristle brushes are simply false.",
            },
            {
              question: "How do I keep the handle from getting moldy?",
              answer:
                "Rinse and store it upright in a dry cup, not in a sealed container. Treated this way the handle stays clean for its full three-month life.",
            },
          ],
          seoTitle: "Bamboo Toothbrush 4-Pack (Soft) — Honest Compostability Info",
          seoDescription:
            "Four soft bamboo toothbrushes with BPA-free bristles. We explain what is compostable (handle) and what is not (bristles) — no greenwashing.",
        },
        {
          slug: "classic-medium-4-pack",
          title: "Classic Bamboo Toothbrush 4-Pack, Medium",
          subtitle: "For brushers who prefer firmer feedback",
          description:
            "The same moso bamboo handle and plastic-free packaging as our soft 4-pack, with medium BPA-free bristles for people who prefer a firmer brushing feel.\n\nAn honest note: most dental guidance favors soft bristles, because medium ones can be hard on gums with an aggressive technique. If your gums are sensitive or you press hard, choose soft.",
          shortDescription:
            "Four medium-bristle bamboo toothbrushes with compostable moso handles — for brushers who deliberately prefer firmer bristles.",
          brand: "Bamboo Smile",
          sku: "BAM-CL4M",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.4,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1102",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Firmer feel some brushers strongly prefer",
            "Same compostable handle and plastic-free packaging as the soft pack",
            "Clearly labeled so households can mix soft and medium",
          ],
          cons: [
            "Dental guidance generally favors soft — medium can stress gums if you press hard",
            "Bristles are nylon, not compostable",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes" },
            { label: "Bristles", value: "Medium, BPA-free nylon-6" },
            { label: "Handle", value: "Moso bamboo, water-resistant finish" },
            { label: "Packaging", value: "Recycled kraft paper, no plastic" },
          ],
          useCases: ["adult", "medium", "multipack", "eco"],
          faq: [
            {
              question: "Should I pick soft or medium?",
              answer:
                "If you are unsure, pick soft — that matches general dental guidance. Choose medium only if you know you prefer it and your gums are healthy.",
            },
          ],
          seoTitle: "Bamboo Toothbrush 4-Pack (Medium) — For Firm-Brush Fans",
          seoDescription:
            "Medium-bristle bamboo toothbrush 4-pack with an honest note: soft suits most people better. Compostable handles, plastic-free packaging.",
        },
        {
          slug: "bioblend-soft-2-pack",
          title: "BioBlend Bristle Brush 2-Pack, Extra Soft",
          subtitle: "Castor-oil based bristles — our most plastic-reduced brush",
          description:
            "Our most advanced brush: extra-soft bristles made from a castor-oil based bioblend (about 60% bio-based content) instead of standard nylon, on the same moso bamboo handle.\n\nFull honesty: bioblend bristles are bio-*based*, not home-compostable — they still need to be removed and binned, but they cut fossil plastic content substantially. They are also slightly softer-wearing, so replace at the first sign of splaying. Gentle enough for sensitive gums.",
          shortDescription:
            "Two extra-soft brushes with castor-oil bioblend bristles (≈60% bio-based) — our most plastic-reduced option, honestly labeled.",
          brand: "Bamboo Smile",
          sku: "BAM-BIO2",
          gtin: null,
          price: 9.95,
          compareAtPrice: null,
          cost: 2.9,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1140",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, castor-oil bioblend bristles",
          warranty: null,
          returnable: true,
          pros: [
            "≈60% bio-based bristle content — least fossil plastic in our range",
            "Extra-soft: kind to sensitive gums",
            "Same compostable handle and plastic-free packaging",
          ],
          cons: [
            "Bristles wear slightly faster than nylon — watch for splaying",
            "Still not compostable, despite what some brands claim about bioblends",
          ],
          specs: [
            { label: "Pack size", value: "2 brushes" },
            { label: "Bristles", value: "Extra-soft, castor-oil bioblend (~60% bio-based)" },
            { label: "Handle", value: "Moso bamboo" },
            { label: "Packaging", value: "Recycled kraft paper" },
          ],
          useCases: ["adult", "soft", "sensitive", "zero-waste", "compostable", "eco"],
          faq: [
            {
              question: "Are bioblend bristles compostable?",
              answer:
                "No. Bio-based means the raw material is partly plant-derived; it does not mean home-compostable. Remove and bin the bristles like nylon ones. We would rather be precise than impressive.",
            },
          ],
          seoTitle: "BioBlend Bamboo Toothbrush — Castor-Oil Bristles, Extra Soft",
          seoDescription:
            "Extra-soft castor-oil bioblend bristles (~60% bio-based) on a compostable bamboo handle. Honest about what bio-based does and does not mean.",
        },
        {
          slug: "charcoal-soft-4-pack",
          title: "Charcoal-Infused Bamboo Brush 4-Pack, Soft",
          subtitle: "Soft nylon bristles with activated charcoal — minus the hype",
          description:
            "Soft BPA-free bristles infused with activated charcoal on our standard moso handle. Marketing elsewhere credits charcoal bristles with whitening and antibacterial superpowers; the evidence is thin and we will not repeat those claims.\n\nWhat you actually get: a good soft brush with a matte black look many people prefer, the same honest compostability story as our classic range, and a price only slightly above it.",
          shortDescription:
            "Four soft charcoal-infused bamboo toothbrushes — chosen for looks and feel, sold without the pseudo-medical whitening claims.",
          brand: "Bamboo Smile",
          sku: "BAM-CH4S",
          gtin: null,
          price: 13.95,
          compareAtPrice: null,
          cost: 3.7,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1118",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, charcoal-infused nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Distinct matte-black bristles people genuinely like",
            "Same soft, BPA-free brushing feel as our classic range",
            "No pseudo-medical claims — just a good brush",
          ],
          cons: [
            "Charcoal whitening claims industry-wide are not well supported; do not buy it for that",
            "Bristles are nylon, not compostable",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes" },
            { label: "Bristles", value: "Soft, charcoal-infused nylon-6" },
            { label: "Handle", value: "Moso bamboo" },
            { label: "Packaging", value: "Recycled kraft paper" },
          ],
          useCases: ["adult", "soft", "multipack", "eco"],
          faq: [
            {
              question: "Does charcoal whiten teeth?",
              answer:
                "The evidence for charcoal-bristle whitening is weak, and we do not claim it. If whitening matters to you, talk to your dentist about options that actually work.",
            },
          ],
          seoTitle: "Charcoal Bamboo Toothbrush 4-Pack — Honest, Hype-Free",
          seoDescription:
            "Soft charcoal-infused bamboo toothbrushes sold without fake whitening claims. Good brush, good looks, honest labeling.",
        },
      ],
    },
    {
      slug: "kids-brushes",
      name: "Kids Brushes",
      description:
        "Smaller heads, extra-soft bristles and grippy handles sized for small hands — because the easiest way to make a family plastic-free is gear the kids actually want to use.",
      seoTitle: "Kids Bamboo Toothbrushes — Extra Soft | Bamboo Smile",
      seoDescription:
        "Bamboo toothbrushes for kids: small heads, extra-soft BPA-free bristles, fun colors from food-safe dye. Plastic-free family bathroom, made easy.",
      heroTitle: "Little brushes for little hands",
      heroSubtitle:
        "Extra-soft bristles, small heads and food-safe colored handles that make kids want to brush.",
      sortOrder: 2,
      products: [
        {
          slug: "kids-rainbow-4-pack",
          title: "Kids Bamboo Brush 4-Pack, Rainbow",
          subtitle: "Four colors so everyone knows whose brush is whose",
          description:
            "Four kids brushes with extra-soft BPA-free bristles, small brush heads for mouths aged roughly 3-10, and handles dipped in four different food-safe colors — which settles the daily whose-brush-is-this debate instantly.\n\nThe handles are slightly shorter and thicker than adult brushes, matching how kids actually grip. Same honest materials story as our adult range: compostable handle, binnable bristles.",
          shortDescription:
            "Four kids bamboo toothbrushes in different food-safe colors: extra-soft bristles, small heads, grippy handles for ages ~3-10.",
          brand: "Bamboo Smile",
          sku: "BAM-KID4",
          gtin: null,
          price: 11.95,
          compareAtPrice: null,
          cost: 3.1,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1210",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, food-safe dye, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Four colors end brush mix-ups in shared bathrooms",
            "Extra-soft bristles and small heads sized for kids",
            "Shorter, thicker grip matches small hands",
          ],
          cons: [
            "Kids brushes need replacing more often — chewed bristles splay fast",
            "Supervise brushing under age 6, as with any brush",
          ],
          specs: [
            { label: "Pack size", value: "4 brushes, 4 colors" },
            { label: "Age range", value: "~3-10 years" },
            { label: "Bristles", value: "Extra-soft, BPA-free nylon-6" },
            { label: "Handle", value: "Moso bamboo, food-safe dye" },
          ],
          useCases: ["kids", "family", "soft", "multipack", "eco"],
          faq: [
            {
              question: "From what age can kids use these?",
              answer:
                "From about age 3, with an adult supervising and finishing the brushing until around age 6 — standard dental guidance regardless of brush material.",
            },
          ],
          seoTitle: "Kids Bamboo Toothbrush 4-Pack — Extra Soft, 4 Colors",
          seoDescription:
            "Four colorful kids bamboo toothbrushes: extra-soft bristles, small heads, food-safe dyes. The easy way to a plastic-free family bathroom.",
        },
        {
          slug: "kids-first-brush-2-pack",
          title: "First Brush 2-Pack, Ages 1-3",
          subtitle: "Ultra-soft bristles and a chunky safety grip for toddlers",
          description:
            "A toddler's first toothbrush: ultra-soft bristles on a very small head, and a chunky rounded handle that small fists can hold but cannot push too deep — the safety ring stops the head short.\n\nTwo per pack because toddler brushes get chewed: when bristles splay, replace. Brushing at this age is about habit and gentleness, not scrubbing.",
          shortDescription:
            "Two toddler bamboo brushes (ages 1-3) with ultra-soft bristles, tiny heads and a chunky safety-ring grip.",
          brand: "Bamboo Smile",
          sku: "BAM-TOD2",
          gtin: null,
          price: 8.95,
          compareAtPrice: null,
          cost: 2.6,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1222",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo handle, nylon-6 bristles",
          warranty: null,
          returnable: true,
          pros: [
            "Safety ring prevents the head going too deep",
            "Ultra-soft bristles for first teeth and gums",
            "Chunky grip designed for toddler fists",
          ],
          cons: [
            "Gets chewed — expect to replace more often than every 3 months",
            "Always supervise toddler brushing",
          ],
          specs: [
            { label: "Pack size", value: "2 brushes" },
            { label: "Age range", value: "1-3 years" },
            { label: "Bristles", value: "Ultra-soft, BPA-free nylon-6" },
            { label: "Safety", value: "Depth-stop ring on handle" },
          ],
          useCases: ["kids", "family", "soft", "sensitive", "eco"],
          faq: [
            {
              question: "When should my child get their first toothbrush?",
              answer:
                "Dental guidance says to start brushing when the first tooth appears. This brush is designed for exactly that stage — with an adult doing the brushing.",
            },
          ],
          seoTitle: "Toddler Bamboo Toothbrush 2-Pack (Ages 1-3) — Ultra Soft",
          seoDescription:
            "First bamboo toothbrush for ages 1-3: ultra-soft bristles, tiny head, safety-ring grip. Honest guidance on toddler brushing included.",
        },
        {
          slug: "kids-timer-hourglass",
          title: "Two-Minute Brushing Hourglass",
          subtitle: "A bathroom-proof sand timer that makes two minutes visible",
          description:
            "The single cheapest upgrade to a kid's brushing routine: a two-minute hourglass with a suction cup that sticks to tile or mirror at kid height. Flip it, brush until the green sand runs out.\n\nNo batteries, no app, no plastic toy that breaks in a month — a glass timer in a bamboo frame that turns the abstract 'two minutes' into something a four-year-old can see and own.",
          shortDescription:
            "Two-minute hourglass in a bamboo frame with suction mount — makes the dentist-recommended brushing time visible for kids.",
          brand: "Bamboo Smile",
          sku: "BAM-TIMER",
          gtin: null,
          price: 9.5,
          compareAtPrice: null,
          cost: 2.8,
          shippingCost: 2.4,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1240",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Bamboo frame, glass vial, silicone suction cup",
          warranty: null,
          returnable: true,
          pros: [
            "Makes the two-minute target concrete for kids",
            "No batteries or apps — flip and brush",
            "Suction cup mounts at kid height",
          ],
          cons: [
            "Glass vial — mount it out of grabbing range for the youngest",
            "Sand timing is approximate (±10 seconds)",
          ],
          specs: [
            { label: "Duration", value: "2 minutes (±10 s)" },
            { label: "Frame", value: "Bamboo" },
            { label: "Mount", value: "Silicone suction cup" },
          ],
          useCases: ["kids", "family", "eco"],
          faq: [
            {
              question: "Why two minutes?",
              answer:
                "Two minutes twice a day is the standard dental recommendation. Most people — adults included — brush for far less when they do not time it.",
            },
          ],
          seoTitle: "Kids Brushing Timer — 2-Minute Bamboo Hourglass",
          seoDescription:
            "A two-minute bamboo-framed hourglass with suction mount that makes proper brushing time visible for kids. No batteries, no apps.",
        },
        {
          slug: "kids-travel-case",
          title: "Kids Brush Travel Case",
          subtitle: "Ventilated bamboo case sized for kids brushes",
          description:
            "A ventilated travel case in solid bamboo, sized for our kids brushes. The ventilation slots matter: a wet brush sealed in an airtight box grows things you do not want near a mouth, so this case is deliberately not airtight.\n\nFits school trips, sleepovers and family travel; the lid twists shut so it stays closed in a backpack.",
          shortDescription:
            "Ventilated bamboo travel case for kids toothbrushes — deliberately not airtight, so brushes dry instead of growing mold.",
          brand: "Bamboo Smile",
          sku: "BAM-KCASE",
          gtin: null,
          price: 7.95,
          compareAtPrice: null,
          cost: 2.2,
          shippingCost: 2.1,
          stockStatus: "LOW_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1255",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Solid bamboo",
          warranty: null,
          returnable: true,
          pros: [
            "Ventilated so brushes dry properly",
            "Twist-lock lid survives backpacks",
            "Solid bamboo, no plastic liner",
          ],
          cons: [
            "Sized for kids brushes — adult brushes do not fit",
            "Not watertight (by design)",
          ],
          specs: [
            { label: "Fits", value: "Kids brushes up to 16 cm" },
            { label: "Material", value: "Solid bamboo" },
            { label: "Closure", value: "Twist-lock, ventilated" },
          ],
          useCases: ["kids", "travel", "eco"],
          faq: [
            {
              question: "Why is the case not airtight?",
              answer:
                "Because wet brushes need airflow to dry. Sealed cases trap moisture and breed bacteria and mold — ventilation is a hygiene feature, not a flaw.",
            },
          ],
          seoTitle: "Kids Toothbrush Travel Case — Ventilated Bamboo",
          seoDescription:
            "Ventilated bamboo travel case for kids brushes. We explain why ventilation beats airtight for toothbrush hygiene.",
        },
      ],
    },
    {
      slug: "oral-care-extras",
      name: "Oral Care Extras",
      description:
        "The rest of a plastic-free routine: compostable floss, brush stands, and refill bundles sized so a whole household switches in one order.",
      seoTitle: "Plastic-Free Oral Care Extras: Floss & Stands | Bamboo Smile",
      seoDescription:
        "Complete the plastic-free routine: corn-fiber floss in refillable glass, bamboo brush stands and family refill bundles with honest material info.",
      heroTitle: "Everything but the toothpaste",
      heroSubtitle:
        "Floss, stands and family refill bundles — the practical extras that make a plastic-free routine stick.",
      sortOrder: 3,
      products: [
        {
          slug: "corn-fiber-floss-glass",
          title: "Corn-Fiber Floss in Refillable Glass Dispenser",
          subtitle: "30 m of PLA floss with candelilla wax, plus a glass dispenser for life",
          description:
            "Floss is one of the worst plastic offenders in the bathroom — single-use nylon in a single-use plastic box. This kit replaces it with corn-fiber (PLA) floss coated in candelilla wax and mint oil, in a glass dispenser with a stainless cutter you refill forever.\n\nHonest materials note: PLA floss is industrially compostable, not home-compostable. It is still a meaningful upgrade over nylon-in-plastic, and refills come in paper.",
          shortDescription:
            "Corn-fiber (PLA) floss with candelilla wax in a refillable glass dispenser. Industrially compostable — labeled honestly.",
          brand: "Bamboo Smile",
          sku: "BAM-FLOSS",
          gtin: null,
          price: 11.5,
          compareAtPrice: null,
          cost: 3.2,
          shippingCost: 2.3,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1310",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "PLA (corn fiber) floss, candelilla wax, glass dispenser",
          warranty: null,
          returnable: true,
          pros: [
            "Glass dispenser is a one-time purchase — refills only after this",
            "Vegan wax coating (candelilla, not beeswax)",
            "Paper-packaged refills",
          ],
          cons: [
            "PLA needs industrial composting — home compost is too cool",
            "Slightly less shred-resistant than nylon floss on tight contacts",
          ],
          specs: [
            { label: "Length", value: "30 m per spool" },
            { label: "Material", value: "PLA corn fiber, candelilla wax, mint oil" },
            { label: "Dispenser", value: "Glass with stainless steel cutter" },
          ],
          useCases: ["adult", "zero-waste", "compostable", "subscription", "eco"],
          faq: [
            {
              question: "Is the floss home-compostable?",
              answer:
                "No — PLA breaks down in industrial composting facilities, not garden compost. We label it accurately; it is still far better than nylon floss in a plastic box.",
            },
          ],
          seoTitle: "Corn-Fiber Floss + Refillable Glass Dispenser — Plastic-Free",
          seoDescription:
            "PLA corn-fiber floss with vegan wax in a refill-forever glass dispenser. Honest note: industrially compostable, not home-compostable.",
        },
        {
          slug: "bamboo-brush-stand-duo",
          title: "Bamboo Brush Stand, 2 Slots",
          subtitle: "Keeps brushes upright, separated and drying — the way they should be stored",
          description:
            "Bamboo handles last their full three months only when they dry upright between uses. This small two-slot stand holds brushes vertically with air around the heads and a drainage groove so water never pools at the base.\n\nSolid bamboo with a water-resistant finish; wipe it weekly and it outlasts years of brushes.",
          shortDescription:
            "Two-slot solid bamboo stand that stores brushes upright and separated with proper airflow and base drainage.",
          brand: "Bamboo Smile",
          sku: "BAM-STAND2",
          gtin: null,
          price: 8.5,
          compareAtPrice: null,
          cost: 2.3,
          shippingCost: 2.3,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1322",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Solid bamboo, water-resistant plant-oil finish",
          warranty: null,
          returnable: true,
          pros: [
            "Upright, separated storage extends brush (and handle) life",
            "Drainage groove keeps the base dry",
            "Outlasts years of brushes",
          ],
          cons: ["Two slots only — larger households need two stands or the family bundle"],
          specs: [
            { label: "Slots", value: "2" },
            { label: "Material", value: "Solid bamboo, oil finish" },
            { label: "Care", value: "Wipe dry weekly" },
          ],
          useCases: ["adult", "family", "eco"],
          faq: [
            {
              question: "Why does brush storage matter?",
              answer:
                "Wet brushes stored flat or sealed stay damp, which shortens bamboo-handle life and is unhygienic for any brush. Upright with airflow is the simple fix.",
            },
          ],
          seoTitle: "Bamboo Toothbrush Stand (2-Slot) — Proper Brush Storage",
          seoDescription:
            "Two-slot bamboo stand that keeps toothbrushes upright, separated and dry — the storage habit that makes bamboo handles last.",
        },
        {
          slug: "family-refill-bundle",
          title: "Family Refill Bundle (8 Brushes + Floss)",
          subtitle: "A quarter of oral care for a family of four, one plastic-free box",
          description:
            "Our best-value bundle: four soft adult brushes, four kids rainbow brushes and a corn-fiber floss refill, in one paper-packed box. It is sized to be exactly one quarter of a family-of-four's brushing — which is why it pairs perfectly with a 3-month reorder rhythm.\n\nSubscription-friendly by design: order once to try it, then set a calendar reminder (or wait for our optional email nudge) every three months. We do not auto-charge; the reminder is the service.",
          shortDescription:
            "Quarterly family bundle: 4 soft adult brushes, 4 kids brushes and a floss refill in one plastic-free box.",
          brand: "Bamboo Smile",
          sku: "BAM-FAM8",
          gtin: null,
          price: 24.95,
          compareAtPrice: 26.4,
          cost: 7.1,
          shippingCost: 3.2,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1350",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Moso bamboo, nylon-6 bristles, PLA floss",
          warranty: null,
          returnable: true,
          pros: [
            "Covers a family of four for a full quarter",
            "Cheaper than buying the parts separately (real math: $26.40)",
            "One reorder rhythm instead of three",
          ],
          cons: [
            "Fixed composition — households without kids should buy packs separately",
          ],
          specs: [
            { label: "Contents", value: "4 adult soft + 4 kids brushes + 30 m floss refill" },
            { label: "Covers", value: "Family of 4 for ~3 months" },
            { label: "Packaging", value: "Single kraft box, no plastic" },
          ],
          useCases: ["family", "kids", "adult", "multipack", "subscription", "zero-waste", "eco"],
          faq: [
            {
              question: "Is this a subscription?",
              answer:
                "No auto-charging. You can opt into a quarterly email reminder and reorder in one click — you stay in control of every payment.",
            },
          ],
          seoTitle: "Family Oral Care Refill Bundle — 8 Brushes + Floss, Quarterly",
          seoDescription:
            "One plastic-free box covering a family of four for a quarter: 4 adult + 4 kids bamboo brushes plus floss. Honest bundle math shown.",
        },
        {
          slug: "travel-case-adult",
          title: "Adult Brush Travel Case",
          subtitle: "Ventilated solid-bamboo case for standard brushes",
          description:
            "The adult version of our ventilated travel case: solid bamboo, twist-lock lid, and airflow slots that let the brush dry instead of fermenting in your wash bag.\n\nFits any standard-length adult brush including every model we sell. Like all our cases it is deliberately not airtight — that is hygiene, not cost-cutting.",
          shortDescription:
            "Ventilated solid-bamboo travel case for adult toothbrushes with a twist-lock lid — designed to let brushes dry.",
          brand: "Bamboo Smile",
          sku: "BAM-ACASE",
          gtin: null,
          price: 8.95,
          compareAtPrice: null,
          cost: 2.5,
          shippingCost: 2.1,
          stockStatus: "IN_STOCK",
          supplierName: "GreenLeaf Supply",
          supplierProductId: "GL-1360",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Solid bamboo",
          warranty: null,
          returnable: true,
          pros: [
            "Ventilation keeps traveling brushes hygienic",
            "Fits all standard adult brushes",
            "Twist-lock lid stays shut in luggage",
          ],
          cons: ["Not watertight (by design)"],
          specs: [
            { label: "Fits", value: "Brushes up to 19.5 cm" },
            { label: "Material", value: "Solid bamboo" },
            { label: "Closure", value: "Twist-lock, ventilated" },
          ],
          useCases: ["adult", "travel", "eco"],
          faq: [
            {
              question: "Will it fit non-bamboo brushes?",
              answer: "Yes — any standard manual brush up to 19.5 cm fits.",
            },
          ],
          seoTitle: "Bamboo Toothbrush Travel Case (Adult) — Ventilated",
          seoDescription:
            "Solid bamboo travel case for adult toothbrushes with hygiene-first ventilation and a twist-lock lid.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "switching-to-bamboo-honestly",
      title: "Switching to Bamboo Toothbrushes: An Honest Guide",
      excerpt:
        "Bamboo brushes eliminate the plastic handle — about 80% of a toothbrush's plastic by weight — but the bristles on almost every bamboo brush are still nylon. Switching is worth it; expecting a 100% compostable brush is not. Here is exactly what changes, what does not, and how to dispose of each part.",
      body: `## The short answer

Switching to bamboo replaces the plastic handle (the bulk of the brush) with a home-compostable material, while the bristles remain nylon or bio-based plastic on essentially every brush on the market. That is a real improvement sold honestly — and a fake one when brands claim "100% compostable".

## What actually changes

- A typical plastic toothbrush is roughly 80% handle by weight. Four billion brushes are discarded globally each year; handles are the bulk of that plastic.
- Bamboo (moso) grows fast without replanting or pesticides and the handle composts at home in months once the bristles are removed.
- Our packaging is paper, so the switch removes the blister pack too.

## What does not change

- **Bristles.** Nylon-6 on standard brushes, castor-oil bioblend (~60% bio-based) on our BioBlend model. Neither is home-compostable. Anyone claiming otherwise is greenwashing.
- **Brushing quality.** A soft bamboo brush cleans exactly as well as a soft plastic brush. Technique and the two-minute rule matter far more than handle material.
- **Replacement rhythm.** Every three months, same as always.

## How to dispose of a used brush

- Pull the bristles out with pliers (ten seconds) and bin them.
- Compost the handle at home, or repurpose it — plant markers are the classic.
- Metal staples holding bristles (tiny) can go to metal recycling with the bristle clump if you separate them.

## Making the switch stick

- Switch the whole household at once — mixed cups of plastic and bamboo brushes tend to drift back to plastic.
- Store brushes upright with airflow (see our stand); damp storage is the one way bamboo handles fail early.
- Put refills on a quarterly rhythm. Our family bundle exists precisely for that.

## Is it worth it?

Yes — honestly framed: you remove the large plastic component of an item you discard four times a year, for a small price difference. You do not achieve a zero-waste bathroom in one purchase, and no toothbrush brand can honestly promise that.`,
      seoTitle: "Switching to Bamboo Toothbrushes — What Changes & What Doesn't",
      seoDescription:
        "An honest guide: bamboo handles compost, nylon bristles do not. What actually improves, how to dispose of each part, and how to make the switch stick.",
      relatedProductSlugs: ["classic-soft-4-pack", "bioblend-soft-2-pack", "bamboo-brush-stand-duo"],
    },
    {
      slug: "soft-vs-medium-bristles",
      title: "Soft vs Medium Bristles: Which Should You Choose?",
      excerpt:
        "Choose soft unless you have a specific reason not to. Dental guidance broadly favors soft bristles because they clean effectively with less risk of gum recession and enamel wear — pressure and technique do the cleaning, not bristle stiffness.",
      body: `## The short answer

**Pick soft.** General dental guidance favors soft bristles for almost everyone, because effective cleaning comes from technique and time, not stiffness — while stiff bristles plus a heavy hand contribute to gum recession and enamel wear. Choose medium only if your gums are healthy and you genuinely prefer the feel with a light technique.

## Why soft wins for most people

- Plaque is soft; it does not need scrubbing force to remove. Two minutes of gentle circles with soft bristles out-cleans thirty seconds of hard sawing with medium ones.
- The most common brushing error is too much pressure. Soft bristles are forgiving of it; medium bristles turn the same habit into gum damage over years.
- Sensitive gums, receding gums, or post-dental-work mouths should always use soft or extra-soft — see our BioBlend extra-soft.

## When medium is legitimate

Some brushers with healthy gums and a deliberately light grip simply prefer firmer tactile feedback and brush longer because of it. If that is you — knowingly — our medium 4-pack exists without judgment. If you are guessing, you are a soft-bristle person.

## Kids are always soft

Children's enamel and gums are developing; every kids brush we sell is extra-soft. There is no medium kids brush here on purpose.

## The two-minute rule beats everything

Whatever bristle you choose, two minutes twice daily with light pressure is the whole game. Our hourglass timer makes that concrete for kids (and, quietly, for adults).

## Quick chooser

- Sensitive or receding gums: **extra-soft** (BioBlend)
- Everyone else, default: **soft** (Classic soft 4-pack)
- Healthy gums + light hand + strong preference: **medium** (Classic medium 4-pack)
- Kids: **extra-soft**, always`,
      seoTitle: "Soft vs Medium Toothbrush Bristles — A Direct Answer",
      seoDescription:
        "Why dental guidance favors soft bristles for nearly everyone, the one case where medium is fine, and why kids brushes are always extra-soft.",
      relatedProductSlugs: ["classic-soft-4-pack", "classic-medium-4-pack", "bioblend-soft-2-pack"],
    },
    {
      slug: "plastic-free-bathroom-routine",
      title: "Building a Plastic-Free Bathroom Routine, One Swap at a Time",
      excerpt:
        "The effective way to de-plastic a bathroom is one finished swap at a time, starting with the items you discard most often: toothbrush first, floss second, then storage. Trying to replace everything in one order is how drawers fill with abandoned eco-gadgets.",
      body: `## The short answer

Swap in order of discard frequency: **toothbrush → floss → storage**. Each swap should be fully working (including the reorder rhythm) before you start the next. This beats the all-at-once approach, which mostly produces a drawer of abandoned eco-products and a return to old habits.

## Swap 1: The toothbrush (month 1)

Highest discard frequency in the bathroom — four per person per year. Switch the entire household at once so the bathroom cup does not become a mixed reminder of the old default. A 4-pack per adult and the rainbow pack for kids covers a quarter.

Set the reorder rhythm immediately: a calendar note every three months, or our optional email reminder. The swap that survives is the one with a working refill loop.

## Swap 2: Floss (month 2)

Floss is single-use plastic in a single-use plastic case — and the glass-dispenser model fixes the case part permanently. One dispenser, then paper-packed refills forever. Honest note from the product page applies here too: PLA floss is industrially compostable, not garden-compostable.

## Swap 3: Storage and travel (month 3)

Two small purchases that protect the first two swaps: an upright stand (bamboo handles last their full life only when they dry properly) and ventilated travel cases so trips do not push you back to hotel plastic.

## What we deliberately do not tell you to do

- Throw away working plastic items. Use them up; replacing functional items early is waste, not sustainability.
- Buy a "zero-waste starter kit" of fifteen items. Three finished swaps beat fifteen started ones.

## The math, honestly

A family of four discards roughly 16 brushes and a dozen floss cases a year. After the three swaps above, the same routine sends bamboo handles to compost and a small clump of bristles to the bin. Not zero — meaningfully less, sustained.`,
      seoTitle: "Plastic-Free Bathroom Routine: The 3-Swap Method That Sticks",
      seoDescription:
        "De-plastic the bathroom one finished swap at a time: toothbrush, floss, then storage. Honest math and the reorder rhythms that make swaps stick.",
      relatedProductSlugs: ["family-refill-bundle", "corn-fiber-floss-glass", "bamboo-brush-stand-duo"],
    },
  ],
  comparison: {
    slug: "brush-comparison",
    title: "Bamboo Smile Brushes Compared: Classic vs Charcoal vs BioBlend",
    excerpt:
      "Classic soft for most people, BioBlend extra-soft for sensitive gums and the lowest fossil-plastic content, charcoal if you like the look — bought for honest reasons.",
    body: "Our three adult brush lines differ in exactly two ways: bristle material and feel. The handles, packaging and compostability story are identical across all three — moso bamboo, kraft paper, remove-bristles-then-compost.\n\nClassic soft is the default recommendation. BioBlend swaps nylon for a castor-oil bioblend (about 60% bio-based) and is the gentlest brush we sell. Charcoal is the classic soft brush with charcoal-infused bristles — buy it because you like matte black, not for whitening claims we refuse to make.",
    seoTitle: "Bamboo Toothbrush Comparison: Classic vs Charcoal vs BioBlend",
    seoDescription:
      "Side-by-side comparison of our adult bamboo brushes: bristle material, softness, bio-based content and price — labeled honestly.",
    productSlugs: ["classic-soft-4-pack", "charcoal-soft-4-pack", "bioblend-soft-2-pack"],
  },
  homepageFaq: [
    {
      question: "Are bamboo toothbrushes really compostable?",
      answer:
        "The handle is home-compostable; the bristles are nylon or bioblend plastic and must be removed and binned first. We label every product accurately — 'fully compostable' brushes with plastic bristles do not exist, no matter what other shops claim.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "From our partner suppliers' facilities in Asia, in plastic-free packaging, typically arriving in 5-12 business days with tracking. We do not hold local stock and we say so.",
    },
    {
      question: "Do you have a subscription?",
      answer:
        "We do reminders, not auto-charges: opt into a quarterly email nudge and reorder in one click. You stay in control of every payment.",
    },
    {
      question: "Can I return an opened brush?",
      answer:
        "For hygiene reasons, no — but defective items are refunded without needing a return. Unopened products return free within 30 days.",
    },
    {
      question: "Do charcoal bristles whiten teeth?",
      answer:
        "The evidence is weak and we do not claim it. Our charcoal brush is sold for its look and feel — for whitening, talk to your dentist about options that actually work.",
    },
  ],
};

export const bambooPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};
