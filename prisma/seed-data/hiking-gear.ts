import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Hiking gear store: rugged, practical brand. */

const info: SeedStoreInfo = {
  slug: "hiking-gear",
  name: "Ridgeline Supply",
  legalName: "Ridgeline Supply Commerce ApS",
  primaryDomain: "turklar.example",
  locale: "en-US",
  currency: "USD",
  niche: "hiking gear",
  positioning:
    "Trail gear rated by weight, weather resistance and field durability — the three numbers that matter at kilometer twenty. We publish measured weights (not 'from' weights), state real waterproof ratings, and skip gear that only works in the product photo.",
  audience: "day hikers and weekend backpackers",
  valueProposition: "Gear that earns its place in your pack",
  brandVoice: "rugged, practical, no-nonsense",
  logoText: "RIDGELINE",
  supportEmail: "trail@turklar.example",
  supportPhone: null,
  shippingOriginDisclosure:
    "Orders ship from our partner suppliers' warehouses, typically arriving in 6-14 business days with tracking. We don't hold local stock — plan gear orders before the trip, not the night before.",
  defaultShippingDaysMin: 6,
  defaultShippingDaysMax: 14,
  returnPolicySummary:
    "30-day returns on unused gear with tags; field-tested gear that fails within warranty is replaced or refunded — that's what warranties are for.",
};

export const hikingSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#166534",
    secondaryColor: "#14261b",
    accentColor: "#ca8a04",
    backgroundColor: "#f7f8f5",
    textColor: "#1a2419",
    borderRadius: "0.375rem",
    fontHeading: "geometric",
    fontBody: "system-ui",
  },
  domains: ["turklar.example", "www.turklar.example"],
  categories: [
    {
      slug: "packs-bags",
      name: "Packs & Bags",
      description:
        "Daypacks, dry bags and pack accessories with measured weights and honest volume numbers — because a '20L' pack that holds 14 liters ruins more hikes than rain does.",
      seoTitle: "Hiking Daypacks & Dry Bags — Measured Weights | Ridgeline",
      seoDescription:
        "Daypacks and dry bags with honestly measured weights and volumes. Real water-resistance ratings, no 'from' weights, transparent shipping.",
      heroTitle: "Packs with honest numbers",
      heroSubtitle:
        "Measured weights and real volumes on every pack — the two specs the industry fudges most.",
      sortOrder: 1,
      products: [
        {
          slug: "crest-22-daypack",
          title: "Crest 22 Daypack",
          subtitle: "A 22-liter do-everything daypack at a measured 740 g",
          description:
            "The Crest 22 is the pack for 90% of day hikes: 22 measured liters (we fill packs with beans to check — this one is a true 22), a ventilated back panel that actually channels air, and hip-belt pockets sized for a phone and snacks.\n\nAt 740 g measured it is not the lightest 22-liter pack made, and we will not pretend otherwise — the weight buys a frame sheet, real padding and 210D fabric that survives granite scrapes. Rain cover included and stowed in the bottom pocket.",
          shortDescription:
            "True-22-liter daypack at 740 g measured: ventilated back, hip-belt pockets, included rain cover, 210D fabric.",
          brand: "Ridgeline",
          sku: "HIK-CREST22",
          gtin: null,
          price: 64.95,
          compareAtPrice: null,
          cost: 22.4,
          shippingCost: 6.8,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4110",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "Vietnam",
          materials: "210D ripstop nylon, PU coating",
          warranty: "24-month warranty on seams and zips",
          returnable: true,
          pros: [
            "True 22 L — we measure, not estimate",
            "Ventilated back panel that actually moves air",
            "Rain cover included, not sold separately",
            "Hip-belt pockets fit phone + snacks",
          ],
          cons: [
            "740 g is mid-weight; ultralighters will want the Featherline",
            "No dedicated hydration port (route the hose over the top)",
          ],
          specs: [
            { label: "Volume", value: "22 L (measured)" },
            { label: "Weight", value: "740 g (measured)" },
            { label: "Fabric", value: "210D ripstop nylon, PU-coated" },
            { label: "Back", value: "Ventilated channel panel" },
            { label: "Included", value: "Rain cover" },
          ],
          useCases: ["day-hike", "summer", "comfort", "padded"],
          faq: [
            {
              question: "Is 22 liters enough for a full-day hike?",
              answer:
                "For three-season day hiking: yes — layers, lunch, water, first aid and a headlamp fit with room over. Winter kit or pack-the-kids duty wants 28-35 L.",
            },
          ],
          seoTitle: "Crest 22 Daypack — True 22L, 740 g Measured, Rain Cover Included",
          seoDescription:
            "A do-everything 22L daypack with honestly measured volume and weight, ventilated back and included rain cover.",
        },
        {
          slug: "featherline-18-ultralight",
          title: "Featherline 18 Ultralight Pack",
          subtitle: "280 g packable pack that disappears until you need it",
          description:
            "The Featherline 18 weighs 280 g and stuffs into its own chest pocket — the pack for summit pushes from a base pack, travel days and fast-and-light missions.\n\nUltralight honesty: 30D fabric trades durability for weight. It shrugs off brush and normal use but will not love granite hauling or 12 kg loads. No frame, minimal padding — pack soft items against your back. Used within its limits it is a brilliant tool; used as a daily hauler it will wear, and we would rather tell you now.",
          shortDescription:
            "280 g ultralight 18L pack that stuffs into its own pocket — for summit pushes and travel, with honest durability limits.",
          brand: "Ridgeline",
          sku: "HIK-FTHR18",
          gtin: null,
          price: 34.95,
          compareAtPrice: null,
          cost: 8.7,
          shippingCost: 3.4,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-1005",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "30D ripstop nylon",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "280 g — you stop noticing it's there",
            "Stuffs into its own pocket, lives in any travel bag",
            "True 18 L when deployed",
          ],
          cons: [
            "30D fabric: not for rock-hauling or heavy loads",
            "No frame or padding — load discipline required",
            "Comfort ceiling around 6-7 kg",
          ],
          specs: [
            { label: "Volume", value: "18 L (measured)" },
            { label: "Weight", value: "280 g (measured)" },
            { label: "Fabric", value: "30D ripstop nylon" },
            { label: "Packed size", value: "Fits own 14 × 10 cm pocket" },
          ],
          useCases: ["ultralight", "day-hike", "summer", "multi-day"],
          faq: [
            {
              question: "Can it be my only hiking pack?",
              answer:
                "If your hikes are light and short, yes. If you carry winter layers, much water or camera gear, the Crest 22's structure earns its extra 460 g fast.",
            },
          ],
          seoTitle: "Featherline 18 — 280 g Ultralight Packable Daypack",
          seoDescription:
            "Ultralight 18L pack at a measured 280 g with honest durability limits: brilliant within them, wrong tool outside them.",
        },
        {
          slug: "drysack-set",
          title: "Dry Sack 3-Set (5/10/20 L)",
          subtitle: "Roll-top organization that keeps the spare layer actually dry",
          description:
            "Three roll-top dry sacks in the sizes that map to real packing: 5 L (electronics, first aid), 10 L (spare clothes), 20 L (sleeping bag or the whole base layer system). Taped seams and 70D fabric — these are genuine dry sacks, not the coated stuff bags that wick at the seams.\n\nRoll three turns minimum and buckle: that is the technique, and it is on the label too. Different colors end the which-bag-is-it rummage.",
          shortDescription:
            "Three taped-seam roll-top dry sacks (5/10/20 L) in different colors — real waterproofing for the gear that must stay dry.",
          brand: "Ridgeline",
          sku: "HIK-DRY3",
          gtin: null,
          price: 28.5,
          compareAtPrice: null,
          cost: 8.2,
          shippingCost: 3.6,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4140",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "70D nylon, TPU lamination, taped seams",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Taped seams — actually waterproof, not water-resistant-ish",
            "Sizes match real packing categories",
            "Color-coded against pack rummage",
          ],
          cons: [
            "Submersion-rated they are not — these are rain-and-river-splash sacks",
            "Roll-top technique matters: three turns minimum",
          ],
          specs: [
            { label: "Sizes", value: "5 L + 10 L + 20 L" },
            { label: "Fabric", value: "70D nylon, TPU laminated" },
            { label: "Seams", value: "Fully taped" },
            { label: "Weight", value: "215 g total (measured)" },
          ],
          useCases: ["rain", "waterproof", "multi-day", "day-hike"],
          faq: [
            {
              question: "Are these submersible?",
              answer:
                "No — roll-tops handle rain, splashes and brief dunks, not sustained submersion. For packraft-style swimming loads, you need submersion-rated bags at several times the price.",
            },
          ],
          seoTitle: "Dry Sack 3-Set (5/10/20 L) — Taped Seams, Honest Ratings",
          seoDescription:
            "Roll-top dry sacks with taped seams in the three sizes packing actually uses. Honest rating: rainproof yes, submersible no.",
        },
        {
          slug: "pack-rain-cover",
          title: "Universal Pack Rain Cover 20-35 L",
          subtitle: "For the packs that didn't come with one",
          description:
            "A sized-right rain cover for 20-35 L packs with an elastic hem, a cinch cord, and the detail cheap covers skip: a small buckle strap that anchors it to the pack so gusts cannot balloon it off the top.\n\nReflective logo for road sections, stuff sack included. Reality note printed on the box: in driving rain, covers protect from above while shoulder-strap runoff wets the back panel — line critical gear in dry sacks regardless.",
          shortDescription:
            "Anchored rain cover for 20-35 L packs with cinch hem and stuff sack — plus the honest advice to still use dry sacks.",
          brand: "Ridgeline",
          sku: "HIK-RAINCVR",
          gtin: null,
          price: 14.95,
          compareAtPrice: null,
          cost: 3.8,
          shippingCost: 2.6,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4155",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "190T polyester, PU 3000 mm coating",
          warranty: null,
          returnable: true,
          pros: [
            "Anchor strap stops gusts stealing it — the cheap-cover failure",
            "True 20-35 L sizing with cinch adjustment",
            "27 g packed, lives in the pack lid",
          ],
          cons: [
            "No cover seals shoulder-strap runoff — dry sacks remain the real insurance",
          ],
          specs: [
            { label: "Fits", value: "20-35 L packs" },
            { label: "Coating", value: "PU 3000 mm" },
            { label: "Weight", value: "27 g (measured)" },
            { label: "Anchor", value: "Buckle strap to pack body" },
          ],
          useCases: ["rain", "waterproof", "day-hike", "budget"],
          faq: [
            {
              question: "Does my Crest 22 need this?",
              answer:
                "No — the Crest 22 ships with its own cover. This one is for packs that came without, or as a replacement for one donated to the wind.",
            },
          ],
          seoTitle: "Pack Rain Cover 20-35 L — Anchored Against Gusts",
          seoDescription:
            "Universal hiking pack rain cover with anchor strap and honest limits: tops yes, strap runoff no — keep using dry sacks.",
        },
      ],
    },
    {
      slug: "trail-essentials",
      name: "Trail Essentials",
      description:
        "The kit that earns permanent pack residency: trekking poles, headlamps, water filtration and first aid — selected by the grams-to-usefulness ratio.",
      seoTitle: "Trail Essentials: Poles, Headlamps & Filters | Ridgeline",
      seoDescription:
        "Trekking poles, headlamps, water filters and first-aid kits chosen by grams-to-usefulness ratio. Measured weights, honest runtimes.",
      heroTitle: "The permanent residents of a good pack",
      heroSubtitle:
        "Poles, light, water and first aid — the four categories that turn a walk into a capable hike.",
      sortOrder: 2,
      products: [
        {
          slug: "carbon-cork-poles",
          title: "Carbon Trekking Poles, Cork Grip (Pair)",
          subtitle: "228 g per pole, flick-locks that hold, cork that molds to your hands",
          description:
            "Carbon poles at 228 g each (measured) with the two features that separate good poles from pole-shaped objects: metal flick-locks that hold under full body weight, and real cork grips that wick sweat and mold to your grip over a season.\n\nPoles reduce knee load meaningfully on descents — that is the science-backed reason to carry them. Carbide tips for rock and dirt, snow baskets included for shoulder-season use.",
          shortDescription:
            "Carbon trekking poles (228 g/pole measured) with metal flick-locks and cork grips; carbide tips, snow baskets included.",
          brand: "Ridgeline",
          sku: "HIK-POLES1",
          gtin: null,
          price: 74.95,
          compareAtPrice: null,
          cost: 26.2,
          shippingCost: 7.2,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4210",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "3K carbon shafts, cork grips, carbide tips",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "228 g per pole — carbon where it counts",
            "Metal flick-locks hold under real load",
            "Cork grips outclass foam in sweat and comfort",
            "Snow baskets included",
          ],
          cons: [
            "Carbon snaps where aluminium bends — pack mules choose alu",
            "Cork needs a season to reach peak comfort",
          ],
          specs: [
            { label: "Weight", value: "228 g per pole (measured)" },
            { label: "Length", value: "62-135 cm, flick-lock" },
            { label: "Shaft", value: "3K carbon" },
            { label: "Grip", value: "Natural cork + EVA choke-up" },
            { label: "Tips", value: "Carbide, rubber caps included" },
          ],
          useCases: ["multi-day", "day-hike", "comfort", "winter", "ultralight"],
          faq: [
            {
              question: "Carbon or aluminium?",
              answer:
                "Carbon is lighter and damps vibration; aluminium bends instead of snapping under abuse. For most hikers carbon is the upgrade; for expedition loads or rough treatment, aluminium forgives more.",
            },
          ],
          seoTitle: "Carbon Trekking Poles with Cork Grips — 228 g Measured",
          seoDescription:
            "Carbon flick-lock trekking poles with cork grips and carbide tips. The honest carbon-vs-aluminium trade-off, explained.",
        },
        {
          slug: "ridgebeam-450-headlamp",
          title: "Ridgebeam 450 Headlamp",
          subtitle: "450 real lumens, USB-C, and a runtime chart you can trust",
          description:
            "A headlamp with honest numbers: 450 lumens on boost (10-minute bursts), 250 lumens for 4 hours, 30 lumens for 40 hours. Published as a chart because 'up to 450 lumens, up to 40 hours' — implying both at once — is the industry's favorite lie.\n\nUSB-C charging, red mode that preserves night vision and tent diplomacy, IPX5 rain rating, and a lockout that stops it igniting inside your pack.",
          shortDescription:
            "450-lumen USB-C headlamp with an honest runtime chart, red mode, IPX5 rating and transport lockout.",
          brand: "Ridgeline",
          sku: "HIK-BEAM450",
          gtin: null,
          price: 39.95,
          compareAtPrice: null,
          cost: 12.8,
          shippingCost: 3.8,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4225",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "PC housing, elastic strap",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Runtime chart published per mode — no 'up to' games",
            "USB-C — one cable for everything",
            "Red mode + pack lockout",
            "78 g with strap (measured)",
          ],
          cons: [
            "Boost mode is thermally limited to bursts (physics, on every lamp)",
            "IPX5 = rain, not submersion",
          ],
          specs: [
            { label: "Output", value: "450 lm boost / 250 lm high / 30 lm low" },
            { label: "Runtime", value: "4 h @ 250 lm, 40 h @ 30 lm" },
            { label: "Battery", value: "1200 mAh, USB-C" },
            { label: "Rating", value: "IPX5" },
            { label: "Weight", value: "78 g (measured)" },
          ],
          useCases: ["day-hike", "multi-day", "winter", "navigation"],
          faq: [
            {
              question: "Why does every headlamp's battery claim seem false?",
              answer:
                "Because 'up to X lumens' and 'up to Y hours' are different modes advertised side by side. Our chart shows which runtime belongs to which brightness — the honest version every lamp should publish.",
            },
          ],
          seoTitle: "Ridgebeam 450 Headlamp — Honest Runtime Chart, USB-C",
          seoDescription:
            "450-lumen headlamp with per-mode runtime published honestly, red mode, lockout and IPX5. 78 g measured.",
        },
        {
          slug: "squeeze-filter-kit",
          title: "Squeeze Water Filter Kit",
          subtitle: "0.1-micron hollow fiber — drink from streams, skip the carry weight",
          description:
            "A 65 g hollow-fiber filter (0.1 micron) that removes bacteria and protozoa from wild water sources — the technology that lets you carry one bottle and a filter instead of three liters. Kit includes two 1 L squeeze pouches, backflush syringe and bottle-thread adapter.\n\nHonest scope: hollow fiber handles biological contamination, not viruses (rare in mountain streams in most temperate regions) or chemical pollution — choose sources accordingly. Critical care note: a frozen filter is a dead filter; sleep with it in cold weather.",
          shortDescription:
            "65 g hollow-fiber squeeze filter (0.1 micron) with pouches and backflush kit — biological filtration for wild water.",
          brand: "Ridgeline",
          sku: "HIK-FILTER1",
          gtin: null,
          price: 32.95,
          compareAtPrice: null,
          cost: 9.4,
          shippingCost: 3.2,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4240",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "United States",
          materials: "Hollow-fiber membrane, BPA-free housing",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "65 g replaces liters of carried water",
            "0.1 micron: bacteria and protozoa filtered",
            "Backflushable for thousands of liters of life",
            "Threads onto standard soda bottles",
          ],
          cons: [
            "Does not remove viruses or chemicals — pick sources sensibly",
            "Freezing destroys the membrane invisibly — pocket it in cold",
            "Flow slows when overdue for a backflush",
          ],
          specs: [
            { label: "Filtration", value: "0.1 micron hollow fiber" },
            { label: "Removes", value: "Bacteria, protozoa, microplastics" },
            { label: "Weight", value: "65 g filter only" },
            { label: "Included", value: "2 × 1 L pouches, syringe, adapter" },
          ],
          useCases: ["multi-day", "ultralight", "day-hike", "summer", "expedition"],
          faq: [
            {
              question: "Can I drink from any stream with this?",
              answer:
                "It handles the biological risks of typical mountain and forest streams. It does not remove agricultural chemicals or viruses — filter upstream of grazing and settlements, not downstream.",
            },
          ],
          seoTitle: "Squeeze Water Filter Kit — 0.1 Micron, 65 g, Honest Limits",
          seoDescription:
            "Hollow-fiber squeeze filter with pouches and backflush kit. What it removes, what it doesn't, and why frozen filters die.",
        },
        {
          slug: "trail-first-aid",
          title: "Trail First Aid Kit",
          subtitle: "The realistic kit: blisters, cuts, sprains — 230 g, IPX-rated pouch",
          description:
            "A first-aid kit built around what actually goes wrong on day hikes and weekenders: blister care (the most-used compartment by far), wound cleaning and closure, an elastic bandage for sprains, tick tweezers and an emergency blanket. 230 g in a welded waterproof pouch.\n\nNo expedition theater — no airway kit you have no training for — just the high-frequency items, organized so cold hands find them. Refill the used items; the pouch outlasts many seasons.",
          shortDescription:
            "Realistic 230 g first-aid kit in a waterproof pouch: blister care, wounds, sprains, ticks, emergency blanket.",
          brand: "Ridgeline",
          sku: "HIK-FAID1",
          gtin: null,
          price: 26.95,
          compareAtPrice: null,
          cost: 7.8,
          shippingCost: 3.4,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4255",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Welded TPU pouch, CE-marked contents",
          warranty: null,
          returnable: true,
          pros: [
            "Blister module first — matching actual trail injury statistics",
            "Welded waterproof pouch, organized compartments",
            "230 g: light enough to never leave the pack",
          ],
          cons: [
            "A kit is not training — know how to use what you carry",
            "Personal medications: add your own",
          ],
          specs: [
            { label: "Weight", value: "230 g (measured)" },
            { label: "Pouch", value: "Welded TPU, waterproof" },
            { label: "Contents", value: "42 items incl. blister kit, elastic bandage" },
            { label: "Extras", value: "Tick tweezers, emergency blanket" },
          ],
          useCases: ["day-hike", "multi-day", "comfort", "expedition"],
          faq: [
            {
              question: "What's the most-used item in a trail first-aid kit?",
              answer:
                "Blister supplies, by a wide margin — which is why this kit leads with a full blister module instead of burying two plasters under expedition gear.",
            },
          ],
          seoTitle: "Trail First Aid Kit — Realistic 230 g Kit, Waterproof Pouch",
          seoDescription:
            "First-aid kit built around real trail statistics: blisters first, wounds and sprains covered, zero expedition theater. 230 g.",
        },
      ],
    },
    {
      slug: "camp-comfort",
      name: "Camp & Comfort",
      description:
        "The overnight layer: sleeping pads, camp stoves, insulated bottles and sit pads — judged on warmth-to-weight honesty and whether they survive season three.",
      seoTitle: "Camp Gear: Pads, Stoves & Bottles | Ridgeline Supply",
      seoDescription:
        "Sleeping pads with real R-values, fast camp stoves and insulated bottles — overnight gear rated on honest warmth-to-weight numbers.",
      heroTitle: "Sleep warm, eat hot, carry less",
      heroSubtitle:
        "Overnight gear with the R-values and boil times printed honestly — comfort at camp is what makes day two good.",
      sortOrder: 3,
      products: [
        {
          slug: "alpine-pad-r4",
          title: "Alpine Sleeping Pad R4.2",
          subtitle: "Real R-value 4.2 at 480 g — three-season warmth that packs small",
          description:
            "An insulated air pad with an honest, standardized R-value of 4.2 — genuinely warm enough for three-season ground including frosty shoulder-season nights. 480 g measured, packs to a 1-liter bottle size, 7 cm thick for side sleepers.\n\nThe included pump sack inflates it in 90 seconds without lightheadedness and keeps moisture out of the pad (moist breath inside an insulated pad degrades it over years). Field repair kit included; punctures happen, dead pads from one thorn should not.",
          shortDescription:
            "Insulated air pad with standardized R4.2 at 480 g measured — 7 cm thick, pump sack and repair kit included.",
          brand: "Ridgeline",
          sku: "HIK-PADR4",
          gtin: null,
          price: 89.95,
          compareAtPrice: null,
          cost: 32.6,
          shippingCost: 7.8,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4310",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "Taiwan",
          materials: "30D ripstop top, synthetic insulation",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Standardized R4.2 — real three-season warmth",
            "7 cm thick: side sleepers sleep",
            "Pump sack included (faster, and keeps breath moisture out)",
            "Repair kit in the stuff sack",
          ],
          cons: [
            "Air pads crinkle; light sleepers should know",
            "480 g is mid-pack: summer-only hikers can go lighter",
          ],
          specs: [
            { label: "R-value", value: "4.2 (standardized)" },
            { label: "Weight", value: "480 g (measured)" },
            { label: "Thickness", value: "7 cm" },
            { label: "Size", value: "183 × 59 cm; packs to 24 × 11 cm" },
            { label: "Included", value: "Pump sack, repair kit" },
          ],
          useCases: ["multi-day", "winter", "insulation", "comfort", "expedition"],
          faq: [
            {
              question: "What does R-value actually mean?",
              answer:
                "Resistance to heat loss into the ground — the number that decides whether you sleep warm. R2 is summer-only, R4+ covers frost, R6+ is winter. The ground steals more heat than the air does.",
            },
          ],
          seoTitle: "Alpine Sleeping Pad — Real R4.2, 480 g, Pump Sack Included",
          seoDescription:
            "Three-season insulated pad with standardized R4.2 and honest weight. R-value explained so you buy warmth, not marketing.",
        },
        {
          slug: "ridgeline-stove-kit",
          title: "Ridgeline Stove + 750 ml Pot Kit",
          subtitle: "Boils 500 ml in ~3.5 min; everything nests into the pot",
          description:
            "A canister-top stove and 750 ml hard-anodized pot that nest together with a 100 g gas canister inside — one fist-sized package that makes hot food and coffee a default instead of a production.\n\nHonest numbers: ~3.5 minutes to boil 500 ml in calm conditions; wind stretches that badly, so use natural windbreaks (a foam windscreen wrapped around a canister stove is a safety risk — it overheats the canister). Piezo igniter plus the matches you should carry anyway.",
          shortDescription:
            "Nesting stove kit: canister-top burner + 750 ml pot, ~3.5 min boils, piezo ignition — hot meals as the default.",
          brand: "Ridgeline",
          sku: "HIK-STOVE1",
          gtin: null,
          price: 44.95,
          compareAtPrice: null,
          cost: 15.2,
          shippingCost: 4.6,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4325",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Hard-anodized aluminium pot, stainless/brass burner",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Stove + pot + small canister nest into one unit",
            "~3.5 min boils (500 ml, calm) — honest, conditions stated",
            "Piezo ignition with manual backup recommended",
          ],
          cons: [
            "Canister stoves weaken below ~-5°C (liquid fuel territory)",
            "Wind murders boil times — plan your kitchen spot",
            "Gas canister not included (shipping rules)",
          ],
          specs: [
            { label: "Boil time", value: "~3.5 min / 500 ml, calm conditions" },
            { label: "Pot", value: "750 ml hard-anodized aluminium" },
            { label: "Weight", value: "318 g kit (measured, no canister)" },
            { label: "Ignition", value: "Piezo + carry matches" },
          ],
          useCases: ["multi-day", "comfort", "winter", "expedition"],
          faq: [
            {
              question: "Why is no gas canister included?",
              answer:
                "Pressurized canisters can't ship by standard air freight. Every outdoor shop and most supermarkets near trailheads stock the standard screw-thread canisters this uses.",
            },
          ],
          seoTitle: "Ridgeline Stove Kit — Nesting 750 ml Pot, Honest Boil Times",
          seoDescription:
            "Canister stove and pot kit that nests into one unit. Real boil times with conditions stated, plus cold-weather limits explained.",
        },
        {
          slug: "summit-bottle-insulated",
          title: "Summit Insulated Bottle 750 ml",
          subtitle: "Hot 10 hours, cold 22 — and it survives being dropped on rock",
          description:
            "A double-wall vacuum bottle in 18/8 stainless that holds heat through a winter day (10 h hot tested at 20°C ambient, 22 h cold) and shrugs off the drops that dent thinner bottles. Two lids included: a sip lid for the move and a sealed cap for the pack.\n\nThe honest trade-off of all vacuum bottles: 365 g empty. In summer, carry the weight only if you want cold water at the summit badly enough; in winter, a hot drink at the turnaround is worth double the grams.",
          shortDescription:
            "750 ml vacuum bottle: 10 h hot / 22 h cold tested, dent-resistant 18/8 steel, two lids included. 365 g — an honest trade-off.",
          brand: "Ridgeline",
          sku: "HIK-BOTTLE1",
          gtin: null,
          price: 29.95,
          compareAtPrice: null,
          cost: 8.9,
          shippingCost: 4.2,
          stockStatus: "IN_STOCK",
          supplierName: "TrailGear Wholesale",
          supplierProductId: "TG-4340",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "18/8 stainless steel, double-wall vacuum",
          warranty: "24-month warranty on vacuum seal",
          returnable: true,
          pros: [
            "10 h hot / 22 h cold — tested, conditions stated",
            "Survives rock drops that kill thin-wall bottles",
            "Two lids: sip for the trail, sealed for the pack",
          ],
          cons: [
            "365 g empty — summer hikers may prefer a plastic bottle + filter",
            "Hand-wash; dishwashers age the vacuum seal",
          ],
          specs: [
            { label: "Volume", value: "750 ml" },
            { label: "Insulation", value: "10 h hot / 22 h cold (20°C ambient)" },
            { label: "Steel", value: "18/8 stainless, BPA-free lids" },
            { label: "Weight", value: "365 g (measured)" },
          ],
          useCases: ["winter", "day-hike", "comfort", "insulation"],
          faq: [
            {
              question: "Is it worth the weight in summer?",
              answer:
                "Honestly, often not — a plastic bottle and the squeeze filter weigh less combined. The bottle earns its place when temperature matters: winter hikes, hot coffee, all-day cold water in heat waves.",
            },
          ],
          seoTitle: "Summit Insulated Bottle 750 ml — 10 h Hot, Tested Honestly",
          seoDescription:
            "Vacuum bottle with tested insulation times and the honest weight trade-off per season. Dent-resistant, two lids included.",
        },
        {
          slug: "foam-sit-pad",
          title: "Folding Foam Sit Pad",
          subtitle: "60 grams between you and cold, wet, sharp everything",
          description:
            "The highest comfort-per-gram item in hiking: a folding closed-cell foam pad that turns wet logs, snowy rocks and frozen ground into seats. 60 g, indestructible, and it doubles as a knee pad for tent pitching, a boost under your sleeping pad's R-value at the hips, and emergency splint padding.\n\nClosed-cell foam absorbs nothing — sit in a puddle, stand up dry. It clips to any pack's exterior, which is where it lives between breaks.",
          shortDescription:
            "60 g folding closed-cell sit pad — dry warm seats anywhere, plus half a dozen secondary uses. The best grams in your pack.",
          brand: "Ridgeline",
          sku: "HIK-SITPAD",
          gtin: null,
          price: 12.95,
          compareAtPrice: null,
          cost: 3.1,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-3201",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "IXPE closed-cell foam",
          warranty: null,
          returnable: true,
          pros: [
            "60 g for warm dry seating anywhere, all year",
            "Closed-cell: absorbs no water, ever",
            "Doubles as knee pad, pad-booster, splint padding",
          ],
          cons: [
            "It is a foam square — comfort, not luxury",
          ],
          specs: [
            { label: "Weight", value: "60 g (measured)" },
            { label: "Folded", value: "29 × 19 × 4 cm" },
            { label: "Foam", value: "IXPE closed-cell" },
          ],
          useCases: ["day-hike", "multi-day", "winter", "ultralight", "budget", "comfort"],
          faq: [
            {
              question: "Is this really worth carrying?",
              answer:
                "It is the item experienced hikers defend most stubbornly: 60 g for a dry warm seat at every break, every season. Try one lunch on frozen rock without it and the question answers itself.",
            },
          ],
          seoTitle: "Folding Foam Sit Pad — 60 g of Trail Comfort",
          seoDescription:
            "Closed-cell folding sit pad: dry, warm seating anywhere for 60 g, plus secondary uses. The best comfort-per-gram in hiking.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "day-hike-packing-list",
      title: "The Day-Hike Packing List That Fits in 22 Liters",
      excerpt:
        "A safe three-season day hike needs ten categories of gear — water, food, layers, navigation, light, first aid, sun, knife, fire, shelter — and all ten fit in a 22-liter pack at under 5 kg. Here is the exact list with weights.",
      body: `## The short answer

Pack the ten essentials in their lightweight forms: roughly **4.5-5 kg including water** in a 22 L pack covers a full three-season day hike safely. The list below is the version we actually carry, with measured weights, not the maximal version that turns day hikes into expeditions.

## The list, by category

- **Water (1.5-2 kg):** 1-1.5 L carried + the squeeze filter (65 g) where streams exist. The filter changes the math: carry less, drink more.
- **Food (~400 g):** lunch plus 200 g of margin snacks you do not plan to eat. Energy problems on trail are morale problems.
- **Layers (~600 g):** insulation layer + rain shell, every season, every forecast. Summits are colder and forecasts are suggestions. Dry bag them (10 L).
- **Navigation (~50 g):** offline map on the phone + a paper backup of the area. Phone batteries are also suggestions.
- **Light (~78 g):** the Ridgebeam headlamp, even on morning hikes — 'we walked out by headlamp' beats the alternative story.
- **First aid (~230 g):** the trail kit, led by blister care, because blisters are what actually happens.
- **Sun (~60 g):** SPF + sunglasses; above treeline, non-negotiable.
- **Knife/repair (~80 g):** small knife, tape wrapped around a pole, two zip ties.
- **Fire (~20 g):** lighter + a few storm matches in the first-aid pouch.
- **Emergency shelter (~110 g):** the foil blanket in the first-aid kit plus the sit pad (60 g) — ground insulation if a sprain pins you in place.

## Why a true 22 liters matters

This list fits a *true* 22 L with room for the camera. Packs that measure generous fail you here — which is why we measure volumes with the bean test and print the result. The Crest 22 carries this list with the structure to keep it comfortable; the Featherline 18 carries the summer version of it at 280 g of pack weight.

## The adjustments

- **Winter:** swap to the insulated bottle (hot drink), add microspikes, double the layers, R-value matters at every break (sit pad).
- **Heat waves:** double water, halve layers, keep the shell (storms love heat).
- **With kids:** add 50% snacks and one full extra layer set; their thermostat budget is smaller.`,
      seoTitle: "Day Hike Packing List — Ten Essentials in 22 L, Under 5 kg",
      seoDescription:
        "The complete day-hike list with measured weights: ten essential categories that fit a true 22-liter pack at under 5 kg including water.",
      relatedProductSlugs: ["crest-22-daypack", "squeeze-filter-kit", "ridgebeam-450-headlamp", "trail-first-aid"],
    },
    {
      slug: "stay-dry-hiking-rain",
      title: "Staying Dry on Wet Hikes: The System, Not the Jacket",
      excerpt:
        "No jacket keeps you dry on a long wet hike — you manage moisture instead: shell for the rain, ventilation against sweat, dry sacks for the gear that must stay dry, and a guaranteed-dry layer for breaks. Thinking in systems beats buying a more expensive jacket.",
      body: `## The short answer

Wet-weather comfort is a **system**: rain shell (worn loose and ventilated), pack protection (cover + dry sacks inside), and a guaranteed-dry insulation layer that only comes out at breaks. Chasing dryness with an ever-more-expensive jacket fails because the jacket was never the whole problem — sweat is.

## The uncomfortable physics

A hiking body produces around a liter of sweat per hard hour. Any shell that blocks rain also traps part of that, so on a climb in rain you get wet from one direction or the other. The goal is not staying perfectly dry — it is staying *warm while damp* and having dry things for when you stop.

## The shell: worn right beats bought expensive

- Vent aggressively: pit zips open, front zip cracked on climbs, hood down whenever rain pauses.
- Loose fit over a wicking layer beats a snug fit — airflow is the de-fogger.
- Re-DWR the shell when water stops beading; a wetted-out face fabric breathes roughly not at all.

## Pack protection: layered like the body

- Rain cover for the bulk water (anchored, or the wind takes it as tax).
- Dry sacks inside for the must-stay-dry trio: insulation layer, first aid/electronics, lunch. Covers leak at the back panel by design — straps run there.
- The 5/10/20 L set maps to exactly those three categories. Roll three turns.

## The break-layer rule

One insulation layer lives in a dry sack and is **forbidden while moving**. At breaks it goes over the wet shell (yes, over), trapping your heat while you eat. Hike on, stow it dry again. This single habit separates wet-weather hikers who enjoy it from those who endure it.

## Feet: the lost cause and the fix

On an all-day wet hike, feet get wet — waterproof boots delay it and then hold the water in. The fix is woolen socks (warm while wet) plus dry socks in the 5 L sack reserved for the car or the tent. Chasing all-day dry feet in heavy rain is the most expensive lost cause in hiking.

## The camp transition

Arriving wet at camp: pitch, then immediately change *everything* against the skin into the dry-sack reserves. Wet hiking clothes go back on next morning (awful for two minutes, correct for the trip) — the dry set is sacred for sleep. This is the discipline that makes multi-day rain manageable.`,
      seoTitle: "Staying Dry Hiking in Rain — The System That Actually Works",
      seoDescription:
        "Why no jacket keeps you dry and what does: ventilation discipline, layered pack protection with dry sacks, and the break-layer rule.",
      relatedProductSlugs: ["drysack-set", "pack-rain-cover", "crest-22-daypack"],
    },
    {
      slug: "sleep-warm-outdoors",
      title: "Sleeping Warm Outdoors: R-Values, Layers and the Cold Truths",
      excerpt:
        "Cold nights outdoors are usually lost to the ground, not the air: your pad's R-value matters as much as your sleeping bag's rating. R4+ for frost nights, a real understanding of 'comfort' vs 'limit' bag ratings, and three camp habits cover almost every cold-sleeper's problem.",
      body: `## The short answer

If you sleep cold outdoors, look down before you look up: **the ground steals heat faster than the air**, and a pad with R-value 4+ fixes frosty-night sleep more often than a warmer bag does. After that: trust 'comfort' ratings not 'limit' ratings on bags, and adopt the three pre-sleep habits below.

## R-value, demystified

R-value measures a pad's resistance to conductive heat loss — you compress your sleeping bag's insulation flat under your body weight, so under you, the pad *is* the insulation.

- **R2:** summer ground only.
- **R4+:** three seasons including frost — our Alpine pad sits here at 4.2, standardized testing.
- **R6+:** winter and snow camping.
- Values stack: a 60 g foam sit pad under the hips adds real warmth to any air pad on a marginal night.

## Bag ratings: read the right number

Sleeping bags publish a 'comfort' and a 'limit' temperature. Shops quote the impressive one (limit); your body cares about the other. Plan to the **comfort rating**, and treat even that as assuming a good pad, dry clothes and a fed body — see below.

## The three habits worth a season of gear

- **Eat before sleep.** Calories are fuel for your internal heater; a fatty snack at bedtime runs it through the night.
- **Go to bed warm.** A two-minute walk or some squats before getting in beats an hour of shivering the bag warm. A hot drink (insulated bottle) counts.
- **Sleep in dry layers — not all your layers.** Damp anything is a heat pump pointed the wrong way. Compressing every jacket inside the bag also crushes the bag's loft; drape spares over instead.

## The mistakes that make cold nights

- Air pad bought for thickness with no insulation (R1): comfortable in July, refrigeration in October.
- Breathing into the bag: a night of breath moisture is a wet bag by morning. Nose out, hood cinched.
- Tent ventilation closed 'for warmth': condensation rains on everything by 3 am. Vents open, always.

## A worked example

Frosty shoulder-season night, 0°C ground: Alpine pad (R4.2) + comfort-rated 0°C bag + dry base layer + bedtime snack + hot bottle in the footbox = a boringly warm night. Swap any single item for its summer version and you will meet the cold spot it was covering.`,
      seoTitle: "How to Sleep Warm Outdoors — R-Values and Bag Ratings Explained",
      seoDescription:
        "Cold sleepers: the ground is the thief. R-values explained, comfort-vs-limit bag ratings decoded, and the three habits that out-warm new gear.",
      relatedProductSlugs: ["alpine-pad-r4", "summit-bottle-insulated", "foam-sit-pad"],
    },
  ],
  comparison: {
    slug: "daypack-comparison",
    title: "Ridgeline Packs Compared: Crest 22 vs Featherline 18",
    excerpt:
      "Two packs, two philosophies: the Crest 22 carries structure, comfort and a rain cover for all-day hikes; the Featherline 18 weighs 280 g and disappears into a travel bag. Most hikers eventually own both.",
    body: "The Crest 22 and Featherline 18 are not competitors — they are the two halves of how people actually hike. The Crest is the default day pack: framed, padded, ventilated, with the ten-essentials list fitting comfortably and a rain cover in the bottom pocket. The Featherline is the opportunist: 280 g stuffed in its own pocket inside a suitcase or base pack, deployed for summit pushes and city-to-trail days.\n\nThe table shows the real trade: 460 g of structure and durability versus the pack you always have with you. If forced to choose one, choose by your most frequent hike, not your most ambitious one.",
    seoTitle: "Crest 22 vs Featherline 18 — Daypack Comparison",
    seoDescription:
      "Our two daypacks compared honestly: measured weights, volumes, fabric durability and comfort ceilings — and why many hikers own both.",
    productSlugs: ["crest-22-daypack", "featherline-18-ultralight"],
  },
  homepageFaq: [
    {
      question: "Why do you publish 'measured' weights?",
      answer:
        "Because catalog weights in this industry are routinely optimistic — 'from' weights, smallest sizes, no straps. We weigh production samples and print that number. If it is heavier than a competitor's claim, at least it is true.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "From partner supplier warehouses, typically 6-14 business days with tracking. We don't hold local stock — order before the trip, not the night before.",
    },
    {
      question: "Can I return gear I've used on trail?",
      answer:
        "Unused gear with tags returns free within 30 days. Gear that fails in normal use within warranty gets replaced or refunded — that is what a warranty means. Gear you simply wore out hiking is yours; that is what gear is for.",
    },
    {
      question: "What if gear arrives right before a trip and is wrong?",
      answer:
        "Email trail@turklar.example — exchanges get priority handling. Better: order with margin. Supplier shipping is honest but not overnight, and we print that everywhere.",
    },
    {
      question: "Why no customer star ratings?",
      answer:
        "We haven't collected enough verified reviews to show, and we won't invent them. Measured specs and stated limits are our substitute until real reviews accumulate.",
    },
  ],
};

export const hikingPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};
