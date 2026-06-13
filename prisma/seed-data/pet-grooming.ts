import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Pet grooming store: warm, friendly brand. */

const info: SeedStoreInfo = {
  slug: "pet-grooming",
  name: "Fur & Friends",
  legalName: "Fur and Friends Commerce ApS",
  primaryDomain: "pelspleie.example",
  locale: "en-US",
  currency: "USD",
  niche: "pet grooming",
  positioning:
    "Grooming tools chosen by people who actually groom their own dogs and cats. We match every tool to coat type and temperament, tell you when the groomer is the better answer, and never sell a 'miracle' deshedder that does not exist.",
  audience: "dog and cat owners who groom at home",
  valueProposition: "Happy grooming for pets who'd rather be napping",
  brandVoice: "warm, friendly, practical",
  logoText: "Fur & Friends",
  supportEmail: "woof@pelspleie.example",
  supportPhone: null,
  shippingOriginDisclosure:
    "Orders ship from our partner suppliers' warehouses, typically arriving in 5-12 business days with tracking. We don't hold local stock — that honesty keeps our prices fair.",
  defaultShippingDaysMin: 5,
  defaultShippingDaysMax: 12,
  returnPolicySummary:
    "30-day returns on unused tools in original packaging; if a tool genuinely doesn't suit your pet's coat, we'll help you pick the right one or refund you.",
};

export const petGroomingSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#c2410c",
    secondaryColor: "#431407",
    accentColor: "#0d9488",
    backgroundColor: "#fffaf5",
    textColor: "#2d1a10",
    borderRadius: "1.25rem",
    fontHeading: "rounded",
    fontBody: "system-ui",
  },
  domains: ["pelspleie.example", "www.pelspleie.example"],
  categories: [
    {
      slug: "brushes-combs",
      name: "Brushes & Combs",
      description:
        "The daily-driver tools: slickers, deshedding rakes and combs matched to coat type — because the right brush for a husky ruins a poodle's coat, and vice versa.",
      seoTitle: "Pet Brushes & Combs by Coat Type | Fur & Friends",
      seoDescription:
        "Slicker brushes, undercoat rakes and combs matched honestly to coat types. Clear guidance on which tool suits which dog or cat.",
      heroTitle: "The right brush for that coat",
      heroSubtitle:
        "Every brush here states which coats it suits — and which it doesn't. The wrong tool is why brushing 'doesn't work'.",
      sortOrder: 1,
      products: [
        {
          slug: "self-clean-slicker",
          title: "Self-Cleaning Slicker Brush",
          subtitle: "One-click hair release — the everyday brush for most medium and long coats",
          description:
            "The workhorse brush for medium and long coats: fine stainless pins with rounded tips work through topcoat and light undercoat, and the one-click retract ejects the collected hair in a single satisfying pad.\n\nSuits most dogs and long-haired cats for everyday maintenance. Honest fit note: for short, smooth coats (boxers, beagles) a rubber curry mitt is kinder and works better — see our grooming mitt instead.",
          shortDescription:
            "Self-cleaning slicker with rounded stainless pins and one-click hair release — the everyday brush for medium and long coats.",
          brand: "Fur & Friends",
          sku: "PET-SLICK1",
          gtin: null,
          price: 18.95,
          compareAtPrice: null,
          cost: 4.9,
          shippingCost: 2.6,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3110",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Stainless steel pins, ABS handle, TPR grip",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "One-click cleaning — no picking hair from pins",
            "Rounded pin tips are gentle on skin",
            "Comfortable grip for long sessions",
          ],
          cons: [
            "Wrong tool for short smooth coats — use a curry mitt instead",
            "Light undercoat only; heavy shedders need the undercoat rake too",
          ],
          specs: [
            { label: "Pins", value: "Stainless steel, rounded tips" },
            { label: "Cleaning", value: "One-click retract release" },
            { label: "Best for", value: "Medium & long coats, dogs and cats" },
            { label: "Handle", value: "Non-slip TPR grip" },
          ],
          useCases: ["dog", "cat", "long-coat", "detangling"],
          faq: [
            {
              question: "How often should I brush with it?",
              answer:
                "Medium coats: 2-3 times a week. Long coats: daily during shedding season. Short sessions your pet enjoys beat long sessions they tolerate.",
            },
          ],
          seoTitle: "Self-Cleaning Slicker Brush — For Medium & Long Coats",
          seoDescription:
            "One-click self-cleaning slicker with gentle rounded pins. Honest fit guide: great for medium/long coats, wrong for short smooth ones.",
        },
        {
          slug: "undercoat-rake",
          title: "Undercoat Deshedding Rake",
          subtitle: "For double coats that fill the house twice a year",
          description:
            "For huskies, shepherds, collies and other double-coated breeds, shedding season is a structural event. This rake's rotating stainless teeth reach through the topcoat and pull out loose undercoat without cutting healthy hair — unlike blade-style 'deshedders' that slice the topcoat and ruin its weather protection.\n\nUse on dry, detangled coat in the direction of growth. During coat-blow, ten minutes daily for a week beats one heroic hour.",
          shortDescription:
            "Rotating-teeth undercoat rake that removes loose undercoat without cutting topcoat — the honest tool for double-coated shedders.",
          brand: "Fur & Friends",
          sku: "PET-RAKE1",
          gtin: null,
          price: 22.5,
          compareAtPrice: null,
          cost: 6.1,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3125",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Stainless steel teeth, beech handle",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Removes undercoat without cutting topcoat",
            "Rotating teeth follow the coat instead of snagging",
            "Solid beech handle, comfortable for long sessions",
          ],
          cons: [
            "Only for double coats — pointless on single-coated breeds",
            "Won't make a husky stop shedding; nothing will",
          ],
          specs: [
            { label: "Teeth", value: "2 rows, rotating stainless steel" },
            { label: "Best for", value: "Double coats (husky, shepherd, collie...)" },
            { label: "Handle", value: "Beech wood" },
            { label: "Use on", value: "Dry, detangled coat only" },
          ],
          useCases: ["dog", "long-coat", "deshedding"],
          faq: [
            {
              question: "Will this stop my dog shedding?",
              answer:
                "No tool stops shedding — anyone claiming otherwise is selling you a story. This one moves the hair from your dog to the rake before it reaches the sofa, which is the realistic win.",
            },
          ],
          seoTitle: "Undercoat Deshedding Rake — Double Coats, No Topcoat Damage",
          seoDescription:
            "Rotating-teeth undercoat rake for huskies and shepherds. Honest promise: less hair on the sofa, not a shed-free dog.",
        },
        {
          slug: "detangling-comb",
          title: "Stainless Detangling Comb",
          subtitle: "Wide-and-narrow teeth for mats, finishing and behind-the-ears work",
          description:
            "The precision end of the toolkit: a polished stainless comb with a wide-tooth half for working through tangles and a narrow half for finishing and checking your work. If the comb glides to the skin everywhere, the coat is genuinely tangle-free.\n\nEssential for poodles, doodles and long-haired cats, where surface brushing hides forming mats. Work mats from the tip toward the skin, never yank from the root.",
          shortDescription:
            "Polished stainless comb with wide and narrow teeth — the precision tool for tangles, mats and grooming quality control.",
          brand: "Fur & Friends",
          sku: "PET-COMB1",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.2,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3140",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Polished stainless steel",
          warranty: null,
          returnable: true,
          pros: [
            "The honest test of a finished groom — comb to skin everywhere",
            "Polished teeth glide instead of snagging",
            "One tool for tangle work and finishing",
          ],
          cons: [
            "Severe matting needs clippers or a professional, not a comb",
          ],
          specs: [
            { label: "Material", value: "Polished stainless steel" },
            { label: "Teeth", value: "Dual spacing: wide + narrow" },
            { label: "Length", value: "19 cm" },
          ],
          useCases: ["dog", "cat", "long-coat", "detangling", "sensitive-skin"],
          faq: [
            {
              question: "My pet has a solid mat — comb or clipper?",
              answer:
                "If you cannot work a finger under the mat, do not comb it — that hurts. Tight mats are clipper territory, and close-to-skin mats are a groomer's job. We'd rather lose a sale than have you hurt your pet.",
            },
          ],
          seoTitle: "Stainless Pet Detangling Comb — Wide/Narrow Dual Teeth",
          seoDescription:
            "Polished stainless grooming comb for tangles and finishing, with honest guidance on when mats need clippers or a professional instead.",
        },
        {
          slug: "grooming-mitt",
          title: "Rubber Grooming Mitt",
          subtitle: "For short coats and pets who think brushes are suspicious",
          description:
            "A rubber-nubbed mitt that grooms while it pets — the right tool for short smooth coats and the gateway tool for brush-suspicious pets. Loose hair sticks to the rubber nubs; massage is built in.\n\nWorks wet as a bath scrubber too, lifting shampoo through dense short coats. One size with an adjustable strap fits most hands.",
          shortDescription:
            "Rubber grooming mitt that removes loose hair from short coats while petting — ideal for brush-shy dogs and cats.",
          brand: "Fur & Friends",
          sku: "PET-MITT1",
          gtin: null,
          price: 10.95,
          compareAtPrice: null,
          cost: 2.7,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3155",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Natural rubber nubs, mesh back",
          warranty: null,
          returnable: true,
          pros: [
            "Feels like petting — perfect for nervous groomees",
            "The correct tool for short smooth coats",
            "Doubles as a bath scrubber",
          ],
          cons: [
            "Surface tool only — useless on undercoat and tangles",
            "Hand-wash and air-dry to keep the rubber grippy",
          ],
          specs: [
            { label: "Surface", value: "Natural rubber nubs" },
            { label: "Best for", value: "Short smooth coats; nervous pets" },
            { label: "Fit", value: "One size, adjustable strap" },
            { label: "Wet use", value: "Yes — bath scrubbing" },
          ],
          useCases: ["dog", "cat", "short-coat", "sensitive-skin", "quiet"],
          faq: [
            {
              question: "My cat hates every brush. Will this work?",
              answer:
                "It is the best first move — most cats read it as petting. Keep first sessions short and treat-heavy, and let the cat leave whenever it wants.",
            },
          ],
          seoTitle: "Rubber Pet Grooming Mitt — Short Coats & Nervous Pets",
          seoDescription:
            "Grooming mitt that works like petting: right tool for short smooth coats and brush-suspicious cats and dogs. Wet or dry use.",
        },
      ],
    },
    {
      slug: "clippers-trimming",
      name: "Clippers & Trimming",
      description:
        "Quiet clippers, nail tools and trimming scissors for home maintenance between professional grooms — with honest guidance on what belongs at the groomer.",
      seoTitle: "Pet Clippers & Nail Trimming Tools | Fur & Friends",
      seoDescription:
        "Quiet cordless clippers, nail clippers, grinders and trimming scissors for home grooming — with honest notes on what to leave to professionals.",
      heroTitle: "Maintenance trims, minus the drama",
      heroSubtitle:
        "Quiet tools for the between-groomer work: nails, paws, face tidying and touch-ups.",
      sortOrder: 2,
      products: [
        {
          slug: "quiet-cordless-clipper",
          title: "Quiet Cordless Clipper Kit",
          subtitle: "50 dB motor for sound-sensitive pets, with 4 guard combs",
          description:
            "A cordless clipper built around the spec that matters most at home: noise. At roughly 50 dB — quiet conversation level — it stays under the panic threshold of most sound-sensitive pets. Ceramic-titanium blades stay cooler than all-steel, and four guards (3/6/9/12 mm) cover maintenance trims.\n\nHonest scope: this handles touch-ups, paws, sanitary trims and light body work. Full breed cuts on thick or matted coats need pro-grade clippers and skills — that is a groomer visit, and we say so.",
          shortDescription:
            "~50 dB cordless clipper with ceramic-titanium blade and 4 guards — built for sound-sensitive pets and maintenance trims.",
          brand: "Fur & Friends",
          sku: "PET-CLIP1",
          gtin: null,
          price: 42.95,
          compareAtPrice: null,
          cost: 14.8,
          shippingCost: 4.4,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3210",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Ceramic-titanium blade, ABS body",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "~50 dB — most nervous pets tolerate it",
            "Ceramic blade runs cooler against the skin",
            "Cordless, 90 min per charge, USB-C",
          ],
          cons: [
            "Not for full cuts on thick or matted coats",
            "Blade oiling before each use is required maintenance",
          ],
          specs: [
            { label: "Noise", value: "~50 dB" },
            { label: "Blade", value: "Ceramic-titanium, detachable" },
            { label: "Guards", value: "3, 6, 9, 12 mm" },
            { label: "Battery", value: "90 min, USB-C charging" },
          ],
          useCases: ["dog", "cat", "sensitive-skin", "quiet", "long-coat"],
          faq: [
            {
              question: "Can I do my doodle's full haircut with this?",
              answer:
                "Honestly: no. Doodle coats need pro-grade clippers and technique. This kit keeps the face, paws and sanitary areas tidy between groomer visits — which stretches the interval and saves money anyway.",
            },
          ],
          seoTitle: "Quiet Cordless Pet Clipper (~50 dB) — For Nervous Pets",
          seoDescription:
            "Cordless clipper quiet enough for sound-sensitive pets, with honest scope: maintenance trims yes, full breed cuts no.",
        },
        {
          slug: "led-nail-clippers",
          title: "LED Nail Clippers with Quick Guard",
          subtitle: "See the quick before you cut — fewer nail-trim standoffs",
          description:
            "Nail trims go wrong at exactly one point: cutting the quick. These clippers put an LED behind the nail so the quick shows as a pink shadow in light-colored nails, plus a physical guard that limits how much nail can enter the blade.\n\nFor dark nails where the LED cannot help, trim 1-2 mm at a time watching the cut face — when a dark dot appears in the center, stop. That technique note ships in the box too.",
          shortDescription:
            "Pet nail clippers with LED quick-illumination and a safety guard — built to prevent the one mistake that ruins nail trims.",
          brand: "Fur & Friends",
          sku: "PET-NAIL1",
          gtin: null,
          price: 15.95,
          compareAtPrice: null,
          cost: 4.1,
          shippingCost: 2.4,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3225",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Stainless blades, ABS handle",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "LED makes the quick visible in light nails",
            "Physical guard limits over-cutting",
            "Sharp stainless blades crush less, cut cleaner",
          ],
          cons: [
            "LED cannot illuminate dark nails — use the 1-2 mm technique",
            "Large-breed thick nails may suit a grinder better",
          ],
          specs: [
            { label: "Blades", value: "Stainless steel" },
            { label: "Light", value: "LED quick-illumination" },
            { label: "Safety", value: "Adjustable depth guard" },
            { label: "Battery", value: "2 × AAA (included)" },
          ],
          useCases: ["dog", "cat", "sensitive-skin"],
          faq: [
            {
              question: "What if I cut the quick anyway?",
              answer:
                "Press styptic powder (or plain cornstarch) on the tip for a minute or two and stay calm — it looks worse than it is. Then trim less per cut next time, and rebuild trust with treats.",
            },
          ],
          seoTitle: "LED Pet Nail Clippers with Quick Guard — Safer Nail Trims",
          seoDescription:
            "Nail clippers with LED quick-light and depth guard, plus the dark-nail technique most shops never explain.",
        },
        {
          slug: "nail-grinder-quiet",
          title: "Whisper Nail Grinder",
          subtitle: "Low-vibration grinding for dogs who refuse clippers",
          description:
            "Some dogs never accept the squeeze of clippers but tolerate grinding — especially with a tool engineered for low noise (under 45 dB) and low hand vibration like this one. The diamond-bit wheel rounds nails smoothly, removing the sharp edges clippers leave.\n\nThe trade-off is time: grinding takes longer per nail, and acclimation (paw handling, tool-off, tool-on-nearby, then short touches) takes a patient week. The included guide walks through it day by day.",
          shortDescription:
            "Under-45 dB nail grinder with diamond bit and 3 speeds — the patient alternative for clipper-refusing dogs.",
          brand: "Fur & Friends",
          sku: "PET-GRIND1",
          gtin: null,
          price: 24.95,
          compareAtPrice: null,
          cost: 7.6,
          shippingCost: 2.8,
          stockStatus: "LOW_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3240",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Diamond grinding bit, ABS body",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Under 45 dB with low hand vibration",
            "Leaves smooth, rounded nails — no sharp clipper edges",
            "Three speeds; USB-C rechargeable",
          ],
          cons: [
            "Slower than clipping — patience required",
            "A week of acclimation is normal, not a product flaw",
          ],
          specs: [
            { label: "Noise", value: "< 45 dB" },
            { label: "Bit", value: "Diamond, 3 port sizes" },
            { label: "Speeds", value: "3" },
            { label: "Battery", value: "USB-C, ~4 h runtime" },
          ],
          useCases: ["dog", "quiet", "sensitive-skin"],
          faq: [
            {
              question: "Grinder or clippers — which should I buy?",
              answer:
                "Clippers are faster if your dog tolerates them. The grinder is for dogs who hate the clipper squeeze, and for smoothing after clipping. Many households end up using both.",
            },
          ],
          seoTitle: "Whisper Pet Nail Grinder (<45 dB) — For Clipper-Refusers",
          seoDescription:
            "Low-noise, low-vibration nail grinder with diamond bit and a day-by-day acclimation guide. Honest trade-off: gentler but slower.",
        },
        {
          slug: "rounded-trim-scissors",
          title: "Rounded-Tip Trimming Scissors Set",
          subtitle: "Safety-tip scissors for face, paws and sanitary areas",
          description:
            "Two scissors for the precision zones where clippers feel too big: a rounded-tip straight pair for face and paw-pad edges, and a small thinning pair for blending the cut lines so home trims do not look like home trims.\n\nThe rounded tips are the point (so to speak): around eyes and paw pads, a sudden head-jerk meets a blunt curve, not a blade tip. Japanese stainless holds its edge for years of home use.",
          shortDescription:
            "Rounded-safety-tip straight + thinning scissors in Japanese stainless — for face, paws and blending home trims.",
          brand: "Fur & Friends",
          sku: "PET-SCIS1",
          gtin: null,
          price: 19.95,
          compareAtPrice: null,
          cost: 5.4,
          shippingCost: 2.4,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3255",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "Pakistan",
          materials: "Japanese stainless steel",
          warranty: null,
          returnable: true,
          pros: [
            "Rounded tips protect eyes and pads from sudden movements",
            "Thinning pair hides the cut lines",
            "Edge-holding Japanese stainless",
          ],
          cons: [
            "For detail work only — body trimming wants clippers",
          ],
          specs: [
            { label: "Set", value: "Straight (rounded tip) + thinning" },
            { label: "Steel", value: "Japanese stainless" },
            { label: "Length", value: "16 cm each" },
          ],
          useCases: ["dog", "cat", "long-coat", "sensitive-skin"],
          faq: [
            {
              question: "What are thinning scissors for?",
              answer:
                "They cut only some hair per snip, blending harsh lines into the surrounding coat. They are the difference between 'freshly trimmed' and 'trimmed by an enthusiastic owner'.",
            },
          ],
          seoTitle: "Rounded-Tip Pet Trimming Scissors — Face & Paw Safety Set",
          seoDescription:
            "Safety-tip straight and thinning scissors for the precision zones: face, paws, sanitary. Japanese stainless, honest scope notes.",
        },
      ],
    },
    {
      slug: "bath-skin-care",
      name: "Bath & Skin Care",
      description:
        "Bath-time gear and coat care that respects pet skin pH — pet shampoos, drying towels and massage scrubbers that make wash day less of a wrestling match.",
      seoTitle: "Pet Bath & Skin Care: Shampoo & Drying | Fur & Friends",
      seoDescription:
        "pH-correct pet shampoo, fast-drying towels and bath scrubbers. Honest guidance: human shampoo is the wrong pH for pet skin.",
      heroTitle: "Wash day, without the wrestling",
      heroSubtitle:
        "pH-correct washing, faster drying, calmer pets — the gear that turns bath chaos into routine.",
      sortOrder: 3,
      products: [
        {
          slug: "oatmeal-ph-shampoo",
          title: "Oatmeal pH-Balanced Pet Shampoo",
          subtitle: "Formulated for pet skin pH — because human shampoo isn't",
          description:
            "Pet skin sits near pH 7, human skin near 5.5 — which is why human shampoo (formulated acidic) dries and irritates pet skin over time. This colloidal-oatmeal formula is balanced for pet skin, fragrance-light, and free of parabens and dyes.\n\nIt soothes the mild itch-and-flake cycle of dry skin and rinses out fast — the step most baths shortchange. Persistent scratching, redness or odor is a vet matter, not a shampoo matter; we print that on the bottle.",
          shortDescription:
            "Colloidal oatmeal shampoo balanced for pet skin pH (~7), fragrance-light, paraben-free — for dogs and cats over 12 weeks.",
          brand: "Fur & Friends",
          sku: "PET-SHAM1",
          gtin: null,
          price: 14.95,
          compareAtPrice: null,
          cost: 3.9,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3310",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "United States",
          materials: "Colloidal oatmeal, coconut-derived cleansers",
          warranty: null,
          returnable: true,
          pros: [
            "pH-balanced for pet skin (~7), unlike human shampoo",
            "Colloidal oatmeal calms mild dry-skin itch",
            "Free of parabens, dyes and heavy fragrance",
          ],
          cons: [
            "Not a treatment for skin conditions — persistent issues need a vet",
            "Light lather by design; it still cleans",
          ],
          specs: [
            { label: "Volume", value: "473 ml" },
            { label: "pH", value: "Balanced for pet skin (~7)" },
            { label: "Key ingredient", value: "Colloidal oatmeal 2%" },
            { label: "Suitable for", value: "Dogs & cats from 12 weeks" },
          ],
          useCases: ["dog", "cat", "sensitive-skin", "short-coat", "long-coat"],
          faq: [
            {
              question: "Can I use my own shampoo on my dog?",
              answer:
                "Skip it — human shampoo is formulated for pH ~5.5 skin and pet skin sits near 7. Occasional use won't cause a crisis, but regular use dries and irritates their skin barrier.",
            },
          ],
          seoTitle: "Oatmeal Pet Shampoo, pH-Balanced — Why Human Shampoo Fails",
          seoDescription:
            "pH-correct oatmeal shampoo for dogs and cats, with the honest explanation of why human shampoo is wrong for pet skin.",
        },
        {
          slug: "microfiber-drying-towel",
          title: "Microfiber Drying Towel XL",
          subtitle: "Absorbs several times its weight — cuts shake-spray and dryer time",
          description:
            "An oversized (140 × 76 cm) microfiber towel with hand pockets at both ends, so the towel stays on the dog during the post-bath shake instead of on your bathroom walls. Microfiber pulls water out of undercoat that cotton towels just push around.\n\nLess water in the coat means less hot-dryer time — the part of bath day most pets hate most. Machine-washable; skip fabric softener, which clogs microfiber.",
          shortDescription:
            "XL microfiber towel with hand pockets — soaks up undercoat water fast and contains the post-bath shake.",
          brand: "Fur & Friends",
          sku: "PET-TOWEL1",
          gtin: null,
          price: 16.95,
          compareAtPrice: null,
          cost: 4.6,
          shippingCost: 3.1,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3325",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "80/20 polyester/polyamide microfiber",
          warranty: null,
          returnable: true,
          pros: [
            "Dramatically faster drying than cotton towels",
            "Hand pockets keep the towel on during shakes",
            "XL size wraps large breeds",
          ],
          cons: [
            "Wash without fabric softener or absorbency drops",
            "Hooks slightly on very long claws",
          ],
          specs: [
            { label: "Size", value: "140 × 76 cm" },
            { label: "Material", value: "Microfiber 80/20" },
            { label: "Care", value: "Machine wash, no softener" },
          ],
          useCases: ["dog", "cat", "long-coat", "short-coat"],
          faq: [
            {
              question: "Why not just use old bath towels?",
              answer:
                "Cotton pushes water around a dense coat; microfiber pulls it out. The difference is one towel versus three, and far less dryer time for dryer-hating pets.",
            },
          ],
          seoTitle: "XL Microfiber Dog Drying Towel with Hand Pockets",
          seoDescription:
            "Oversized microfiber drying towel that cuts bath drying time and contains the shake. Honest care note: no fabric softener.",
        },
        {
          slug: "bath-massage-scrubber",
          title: "Silicone Bath Massage Scrubber",
          subtitle: "Lathers through dense coats while feeling like a massage",
          description:
            "A palm-strap silicone scrubber that solves the dense-coat bath problem: shampoo sitting on top of the coat while the skin underneath stays dry and unwashed. The soft nubs channel lather down to the skin and turn scrubbing into something pets actively enjoy.\n\nGentler than fingernails, more thorough than fingertips, and it doubles as a wet-coat hair catcher that keeps some fur out of the drain.",
          shortDescription:
            "Palm-strap silicone scrubber that works shampoo through dense coats to the skin — and feels like a massage doing it.",
          brand: "Fur & Friends",
          sku: "PET-SCRUB1",
          gtin: null,
          price: 9.95,
          compareAtPrice: null,
          cost: 2.4,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3340",
          shippingDaysMin: 5,
          shippingDaysMax: 11,
          countryOfOrigin: "China",
          materials: "Food-grade silicone",
          warranty: null,
          returnable: true,
          pros: [
            "Gets shampoo to the skin under dense coats",
            "Most pets read it as massage, not washing",
            "Catches loose hair before the drain does",
          ],
          cons: [
            "Less useful on very short single coats — hands do fine there",
          ],
          specs: [
            { label: "Material", value: "Food-grade silicone" },
            { label: "Fit", value: "Palm strap, one size" },
            { label: "Care", value: "Rinse and air-dry" },
          ],
          useCases: ["dog", "cat", "long-coat", "sensitive-skin", "quiet"],
          faq: [
            {
              question: "Does it work on cats?",
              answer:
                "For the rare cat that gets baths, yes — the massage feel helps. For most cats, brushing with the grooming mitt covers coat care without water.",
            },
          ],
          seoTitle: "Silicone Pet Bath Scrubber — Lather to the Skin",
          seoDescription:
            "Palm scrubber that channels shampoo through dense coats and feels like a massage. Honest note: short single coats don't need it.",
        },
        {
          slug: "paw-balm-tin",
          title: "Paw & Nose Balm",
          subtitle: "Beeswax-based protection for cracked pads and winter salt",
          description:
            "A lick-safe balm of beeswax, shea butter and calendula for dry, cracked paw pads and crusty noses — the unglamorous winter problem of road salt, ice and indoor heating.\n\nApply a thin layer before walks as a salt barrier and after walks as repair; expect most pets to attempt a taste (it is lick-safe, just rub it in first and distract for a minute). Deep cracks that bleed or persistent limping is vet territory.",
          shortDescription:
            "Lick-safe beeswax balm for cracked paw pads and dry noses — barrier before winter walks, repair after.",
          brand: "Fur & Friends",
          sku: "PET-BALM1",
          gtin: null,
          price: 11.5,
          compareAtPrice: null,
          cost: 2.9,
          shippingCost: 2.2,
          stockStatus: "IN_STOCK",
          supplierName: "PetCare Direct",
          supplierProductId: "PD-3355",
          shippingDaysMin: 5,
          shippingDaysMax: 12,
          countryOfOrigin: "United States",
          materials: "Beeswax, shea butter, calendula, vitamin E",
          warranty: null,
          returnable: true,
          pros: [
            "Lick-safe, food-grade ingredients",
            "Works as both pre-walk barrier and post-walk repair",
            "One tin lasts a winter for most dogs",
          ],
          cons: [
            "Bleeding cracks or limping need a vet, not a balm",
            "Softens above 30°C — store cool in summer",
          ],
          specs: [
            { label: "Size", value: "60 ml tin" },
            { label: "Ingredients", value: "Beeswax, shea, calendula, vit. E" },
            { label: "Safety", value: "Lick-safe" },
          ],
          useCases: ["dog", "cat", "sensitive-skin", "short-coat"],
          faq: [
            {
              question: "My dog licks it straight off. Problem?",
              answer:
                "It is lick-safe, so no harm — but it works better absorbed. Rub it in well and serve dinner or a chew right after applying; two minutes of distraction is usually enough.",
            },
          ],
          seoTitle: "Lick-Safe Paw & Nose Balm — Winter Pad Protection",
          seoDescription:
            "Beeswax paw balm for salt, ice and cracked pads — lick-safe, with honest red flags for when a vet beats a balm.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "grooming-tools-by-coat-type",
      title: "Which Grooming Tools Does Your Pet Actually Need? (By Coat Type)",
      excerpt:
        "Match tools to coat, not to marketing: short smooth coats need only a rubber mitt; medium and long coats need a slicker plus a comb; double coats add an undercoat rake. Buying by coat type means two or three tools, not a drawer of regrets.",
      body: `## The short answer

Identify the coat, buy for the coat: **short smooth → mitt. Medium/long → slicker + comb. Double coat → those plus an undercoat rake. Curly/doodle → slicker + comb, used often, plus a groomer relationship.** That is the entire decision tree; everything else in the grooming aisle is situational.

## First: which coat does your pet have?

- **Short smooth** (boxer, beagle, most domestic shorthair cats): hair lies flat, no fluff layer.
- **Medium/long single coat** (spaniels, setters, long-haired cats): visible length, tangles possible, no woolly underlayer.
- **Double coat** (husky, shepherd, collie, Maine Coon): a woolly undercoat beneath the guard hairs; sheds catastrophically twice a year.
- **Curly/wool** (poodles, doodles, bichons): continuously growing coat that mats rather than sheds.

## Short smooth coats: one tool

The rubber grooming mitt removes loose hair and doubles as a bath scrubber. A slicker on this coat is unnecessary and often unpleasant for the pet. Weekly is plenty outside shedding peaks.

## Medium and long single coats: two tools

The self-cleaning slicker for routine brushing (2-3× weekly), and the stainless comb as quality control — if the comb glides to skin everywhere, you are done; where it stops, a tangle is forming. The comb finds the mats the slicker glides over. That pair covers spaniels to long-haired cats.

## Double coats: add the rake

During coat-blow (spring/fall), the undercoat rake moves the dying undercoat out before it carpets your home. Ten minutes daily for a week beats a heroic monthly hour. Never shave a double coat for summer — it wrecks their insulation both ways; the rake plus airflow is the answer.

## Curly and doodle coats: honesty section

These coats mat continuously and need near-daily slicker-and-comb work plus professional cuts every 6-10 weeks. Home kit handles maintenance between visits (see our quiet clipper for face/paw tidying) — but a home-only doodle coat usually ends in a shave-down at the groomer. Budget for both.

## Nails: every coat type

Every pet needs nail care every 3-4 weeks. Clippers with the LED quick-guard if your pet tolerates clipping, the whisper grinder if not. Clicking on the floor means overdue.`,
      seoTitle: "Grooming Tools by Coat Type — The 2-3 Tools You Actually Need",
      seoDescription:
        "A coat-type decision tree for grooming tools: mitt, slicker, comb, rake — what each coat needs and what to skip. No miracle-tool marketing.",
      relatedProductSlugs: ["grooming-mitt", "self-clean-slicker", "undercoat-rake", "detangling-comb"],
    },
    {
      slug: "nail-trimming-without-trauma",
      title: "Nail Trimming Without Trauma: A Week-by-Week Plan",
      excerpt:
        "Pets fear nail trims because of past quick-cuts and restraint, not the tools. The fix is a week of acclimation — paw handling, tool exposure, one nail at a time — plus a tool that prevents the painful mistake: LED clippers or a quiet grinder.",
      body: `## The short answer

Nail-trim battles are learned, which means they can be unlearned: **one week of treat-heavy acclimation, then trim 1-2 nails per session rather than all sixteen-plus in one wrestling match.** Pair the plan with a mistake-preventing tool — LED quick-light clippers or the whisper grinder — and most pets settle within a month.

## Why pets hate nail trims

One cut quick (it hurts, properly) or one forced full-restraint session creates an association that generalizes fast: tool = bad, paw touch = escape. The good news is the association rebuilds the same way it broke — through repetition of the opposite experience.

## The week-by-week plan

- **Days 1-2:** Touch paws during cuddle time. Treat. No tools in sight.
- **Days 3-4:** Tool appears, stays on the floor. Treats near it. If it is the grinder, switch it on across the room so the sound becomes boring.
- **Day 5:** Touch the (off) tool to a paw. Treat generously.
- **Day 6:** One nail. One. Then a party-grade treat and done.
- **Day 7+:** Two to three nails per session, a few sessions a week, until a full rotation happens within the week.

Slow is fast here: a month of two-nail sessions beats a year of quarterly wrestling.

## Choosing the tool

- **LED clippers** — fastest per nail; the light shows the quick in pale nails and the guard limits depth. For dark nails: 1-2 mm per cut, stop at the dark center dot.
- **Whisper grinder** — for clipper-refusers; under 45 dB and no squeeze sensation, at the cost of more time per nail.
- Many households use both: clip, then grind smooth.

## If you cut the quick anyway

Styptic powder or cornstarch, gentle pressure, calm voice, end the session on a treat. It happens to professionals too. The damage to repair is the trust, and the plan above repairs it.

## How short, how often

Trim until just before the quick, every 3-4 weeks; nails clicking on the floor means overdue. Regular trims actually make the quick recede, so consistent maintenance gets easier over time — the opposite of the avoidance spiral.`,
      seoTitle: "Pet Nail Trimming Without Trauma — Week-by-Week Plan",
      seoDescription:
        "Why pets fear nail trims and the 7-day acclimation plan that fixes it, plus honest tool guidance: LED clippers vs quiet grinder.",
      relatedProductSlugs: ["led-nail-clippers", "nail-grinder-quiet"],
    },
    {
      slug: "bath-day-guide",
      title: "Bath Day Done Right: From Pre-Brush to Fully Dry",
      excerpt:
        "A good pet bath follows a fixed order: brush first (wet mats become felt), lukewarm water, pet-pH shampoo worked to the skin, rinse twice as long as feels necessary, then microfiber before any dryer. The order matters more than any single product.",
      body: `## The short answer

Bath day order: **brush → lukewarm water → pet-pH shampoo to the skin → over-rinse → microfiber towel → low-heat dry if needed.** Most bath problems (itchy skin, dull coat, post-bath mats, dryer panic) trace to skipping or rushing one of these steps, not to the wrong shampoo brand.

## Before the water: brush

Water turns loose tangles into felted mats. Five minutes with the slicker (and the comb check) before the bath prevents the post-bath matting people blame on shampoo. Double coats: rake first during shedding season, or you are washing hair that was already leaving.

## Water and shampoo

- Lukewarm, not warm-to-you: pets run hotter and overheat faster.
- Human shampoo is the wrong pH for pet skin (~5.5 vs ~7) — use a pet formula; ours is oatmeal-based and fragrance-light because strong perfume on a nose that sharp is unkind.
- The silicone scrubber gets lather *to the skin* on dense coats. Shampooing the surface of a double coat washes the hair and misses the animal.

## The step everyone shortchanges: rinsing

Rinse until the water runs clean, then rinse that long again. Shampoo residue is the most common cause of post-bath itching and dull coat — it is misdiagnosed as 'shampoo allergy' constantly. Pay special attention to armpits, belly and under the collar line.

## Drying without drama

Microfiber first, always: it pulls water from undercoat that cotton just smears around, and every minute of toweling is several minutes of dryer noise your pet skips. The hand-pocket towel survives the mid-dry shake. If you use a dryer: lowest heat, moving constantly, never pointed at the face.

## How often to bathe

Less than you think: every 4-8 weeks for most dogs, less for many, only-when-dirty for most cats. Over-bathing strips coat oils and causes the dry skin people then buy products to fix. Smell and dirt are the indicators, not the calendar.

## After: the once-over

While the coat dries, do the maintenance round: comb check for missed tangles, nail check (clicking = overdue), paw pads (winter: balm), ears (clean and dry). Five minutes here is what 'well-groomed' actually consists of.`,
      seoTitle: "Pet Bath Day Guide — The Right Order, Start to Dry",
      seoDescription:
        "Brush, lukewarm, pH-correct shampoo, over-rinse, microfiber: the bath order that prevents itching, matting and dryer panic.",
      relatedProductSlugs: ["oatmeal-ph-shampoo", "bath-massage-scrubber", "microfiber-drying-towel", "self-clean-slicker"],
    },
  ],
  comparison: {
    slug: "brush-tool-comparison",
    title: "Brush Showdown: Slicker vs Rake vs Mitt — Which Coat Needs Which",
    excerpt:
      "Three tools, three jobs: the slicker for everyday medium/long coat care, the rake for double-coat shedding season, the mitt for short coats and nervous pets.",
    body: "These three tools cover the brushing needs of nearly every dog and cat — but they are not interchangeable, and the wrong pick is why 'brushing doesn't work for us'. The slicker is the everyday tool for coats with length. The undercoat rake exists for one job: moving dying undercoat out of double-coated breeds before it reaches your furniture. The mitt is the right answer for short smooth coats and the diplomatic answer for pets who distrust anything that looks like a tool.\n\nThe table shows which coats each tool serves, and just as importantly, which it does not.",
    seoTitle: "Slicker vs Undercoat Rake vs Grooming Mitt — Honest Comparison",
    seoDescription:
      "Three brushing tools compared by coat type, job and limits — so you buy the two or three your pet needs instead of a drawer of regrets.",
    productSlugs: ["self-clean-slicker", "undercoat-rake", "grooming-mitt"],
  },
  homepageFaq: [
    {
      question: "How do I know which brush my pet needs?",
      answer:
        "By coat type, not by marketing: short smooth coats want the rubber mitt, medium/long coats the slicker plus comb, double coats add the undercoat rake. Our coat-type guide sorts it in two minutes.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "From partner supplier warehouses, typically arriving in 5-12 business days with tracking. We don't hold local stock and we say so up front.",
    },
    {
      question: "My pet hates being groomed. Where do I start?",
      answer:
        "With the tool that doesn't feel like one: the grooming mitt. Then short, treat-heavy sessions where the pet can leave anytime. Our nail-trim guide's acclimation plan works for brushing too.",
    },
    {
      question: "Can I return a tool that doesn't suit my pet's coat?",
      answer:
        "Unused tools return free within 30 days — and email us first: we'd rather swap you to the right tool than process a refund. Helping you pick correctly is the whole point of the store.",
    },
    {
      question: "Do you sell anything that stops shedding?",
      answer:
        "No, because nothing does — shedding is biology. Our rake and slicker move loose hair onto the tool instead of your sofa, which is the honest version of every 'anti-shedding' claim you've read.",
    },
  ],
};

export const petGroomingPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};
