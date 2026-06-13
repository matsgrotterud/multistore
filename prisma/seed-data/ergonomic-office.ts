import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Ergonomic office store: professional, health/comfort-focused brand. */

const info: SeedStoreInfo = {
  slug: "ergonomic-office",
  name: "UprightWorks",
  legalName: "UprightWorks Commerce ApS",
  primaryDomain: "ergonomikontor.example",
  locale: "en-US",
  currency: "USD",
  niche: "ergonomic office equipment",
  positioning:
    "Desk-setup gear chosen by one criterion: does it measurably reduce strain for people who sit at a screen all day? We explain the ergonomics behind every product, state honest limits (no cushion cures a bad chair), and never use the word 'orthopedic' as decoration.",
  audience: "remote workers and desk professionals with aches that arrive by 3 pm",
  valueProposition: "Work a full day without the 3 pm ache",
  brandVoice: "professional, evidence-aware, calm",
  logoText: "UprightWorks",
  supportEmail: "care@ergonomikontor.example",
  supportPhone: "+1 (555) 010-4410",
  shippingOriginDisclosure:
    "Orders ship directly from our partner suppliers' warehouses. We do not hold local stock; every product page shows its real delivery window, typically 6-13 business days with tracking.",
  defaultShippingDaysMin: 6,
  defaultShippingDaysMax: 13,
  returnPolicySummary:
    "30-day comfort guarantee: if a product does not improve your setup, return it in resaleable condition for a full refund.",
};

export const ergonomicSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#4338ca",
    secondaryColor: "#1e1b4b",
    accentColor: "#0d9488",
    backgroundColor: "#f8f8fc",
    textColor: "#1e1b2e",
    borderRadius: "0.625rem",
    fontHeading: "system-ui",
    fontBody: "system-ui",
  },
  domains: ["ergonomikontor.example", "www.ergonomikontor.example"],
  categories: [
    {
      slug: "seating-support",
      name: "Seating & Support",
      description:
        "Lumbar cushions, seat wedges and footrests that fix the most common sitting problems — chosen because they address posture mechanics, not because they photograph well.",
      seoTitle: "Lumbar Support & Seating Ergonomics | UprightWorks",
      seoDescription:
        "Lumbar cushions, seat cushions and footrests that measurably improve sitting posture. Honest limits stated — no cushion fixes a broken chair.",
      heroTitle: "Fix how you sit first",
      heroSubtitle:
        "The highest-impact, lowest-cost ergonomic upgrades all happen at the chair. Start here before buying anything else.",
      sortOrder: 1,
      products: [
        {
          slug: "contour-lumbar-cushion",
          title: "Contour Lumbar Support Cushion",
          subtitle: "Memory foam that holds the curve your lower back gives up on by noon",
          description:
            "A contoured memory-foam cushion that fills the gap between your lower back and the chair, maintaining the lumbar curve your muscles stop holding after hours of sitting. Two adjustable straps fit office chairs, car seats and dining chairs pressed into home-office duty.\n\nHonest scope: a lumbar cushion reduces slouching strain on a decent chair. It does not turn a kitchen stool into an ergonomic chair, and it works best combined with screen-height fixes — see our laptop stand.",
          shortDescription:
            "Contoured memory-foam lumbar cushion with washable mesh cover and dual straps — keeps your lower back's curve supported through the day.",
          brand: "UprightWorks",
          sku: "ERG-LUMB1",
          gtin: null,
          price: 36.95,
          compareAtPrice: null,
          cost: 11.4,
          shippingCost: 4.8,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2210",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "High-density memory foam, breathable mesh cover",
          warranty: "12-month shape-retention warranty",
          returnable: true,
          pros: [
            "High-density foam keeps its contour (12-month shape warranty)",
            "Dual straps hold position — no constant readjusting",
            "Mesh cover is removable and machine-washable",
          ],
          cons: [
            "Cannot compensate for a chair with a broken backrest",
            "Adds ~5 cm of seat depth — very shallow chairs get tight",
          ],
          specs: [
            { label: "Foam", value: "High-density memory foam, 50D" },
            { label: "Cover", value: "Breathable mesh, machine-washable" },
            { label: "Attachment", value: "2 adjustable straps" },
            { label: "Size", value: "39 × 39 × 10 cm" },
          ],
          useCases: ["back-pain", "lumbar", "budget"],
          faq: [
            {
              question: "Will this fix my back pain?",
              answer:
                "It reduces the slouching strain that aggravates many desk workers' lower backs. Persistent or severe pain needs a clinician, not a cushion — we say that plainly.",
            },
          ],
          seoTitle: "Contour Lumbar Cushion — Memory Foam Back Support for Desk Chairs",
          seoDescription:
            "Memory-foam lumbar cushion with washable cover and strap mounting. Honest scope: reduces slouching strain, doesn't replace a decent chair.",
        },
        {
          slug: "ortho-seat-cushion",
          title: "Pressure-Relief Seat Cushion",
          subtitle: "Gel-infused foam with a coccyx cutout for long sitting days",
          description:
            "A seat cushion engineered around two pressure points: a U-shaped cutout takes load off the tailbone, and gel-infused high-density foam spreads the rest across your thighs instead of two sit bones.\n\nMost useful for people on hard chairs, long-haul drivers, and anyone with tailbone discomfort. The non-slip base actually grips; the handle makes it portable between home, office and car.",
          shortDescription:
            "Gel-infused seat cushion with coccyx cutout and non-slip base — redistributes sitting pressure on hard chairs.",
          brand: "UprightWorks",
          sku: "ERG-SEAT1",
          gtin: null,
          price: 32.95,
          compareAtPrice: null,
          cost: 10.2,
          shippingCost: 4.6,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2225",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Gel-infused memory foam, non-slip rubberized base",
          warranty: "12-month shape-retention warranty",
          returnable: true,
          pros: [
            "Coccyx cutout relieves direct tailbone pressure",
            "Gel layer prevents the heat build-up plain foam suffers",
            "Genuinely non-slip base",
          ],
          cons: [
            "Raises seat height ~4 cm — re-check your desk and screen heights",
            "Too firm for people who prefer plush seating",
          ],
          specs: [
            { label: "Foam", value: "Gel-infused memory foam" },
            { label: "Design", value: "U-shaped coccyx cutout" },
            { label: "Base", value: "Non-slip rubberized" },
            { label: "Size", value: "45 × 36 × 7 cm" },
          ],
          useCases: ["back-pain", "lumbar", "budget"],
          faq: [
            {
              question: "Does it work on an office chair that already has padding?",
              answer:
                "Yes, but the benefit is biggest on hard or thinly padded seats. On a well-padded chair, prioritize lumbar support and screen height first.",
            },
          ],
          seoTitle: "Pressure-Relief Seat Cushion with Coccyx Cutout — Gel Foam",
          seoDescription:
            "Gel-infused seat cushion that redistributes sitting pressure and relieves the tailbone. Honest fit guidance for chair and desk heights.",
        },
        {
          slug: "tilt-footrest",
          title: "Adjustable Tilt Footrest",
          subtitle: "Closes the gap between short legs and tall desks",
          description:
            "If your feet dangle or you tuck them under the chair, your posture collapses no matter how good the chair is. This footrest gives feet a firm, height-adjustable platform (10-16 cm) with a free-tilting surface that keeps ankles moving through the day.\n\nThe textured surface works with or without shoes, and the steel frame does not creep across the floor like hollow plastic footrests.",
          shortDescription:
            "Height-adjustable (10-16 cm) tilting footrest with steel frame — restores proper sitting posture when your desk is too tall.",
          brand: "UprightWorks",
          sku: "ERG-FOOT1",
          gtin: null,
          price: 42.5,
          compareAtPrice: null,
          cost: 14.1,
          shippingCost: 6.2,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2240",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "Taiwan",
          materials: "Steel frame, textured PP platform",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Restores thigh-parallel-to-floor posture at tall desks",
            "Free tilt keeps ankles and calves active",
            "Steel frame stays put on hard floors",
          ],
          cons: [
            "Takes permanent floor space under the desk",
            "Not needed if your feet already rest flat",
          ],
          specs: [
            { label: "Height range", value: "10-16 cm, 4 steps" },
            { label: "Tilt", value: "Free-tilting ±15°" },
            { label: "Platform", value: "45 × 35 cm, textured" },
            { label: "Frame", value: "Powder-coated steel" },
          ],
          useCases: ["back-pain", "movement", "budget"],
          faq: [
            {
              question: "How do I know if I need a footrest?",
              answer:
                "Sit back in your chair with the seat at elbow-height for the desk. If your heels lift or feet dangle, you need a footrest. If feet rest flat, you don't.",
            },
          ],
          seoTitle: "Adjustable Tilt Footrest — Fix Dangling Feet at Tall Desks",
          seoDescription:
            "Steel-framed adjustable footrest (10-16 cm) with free tilt. Includes the 10-second test for whether you actually need one.",
        },
        {
          slug: "balance-cushion",
          title: "Active Sitting Balance Cushion",
          subtitle: "Inflatable wobble cushion that turns a chair into active seating",
          description:
            "An inflatable cushion that introduces controlled instability to your chair, recruiting core and postural muscles that switch off on a static seat. Used in 20-40 minute intervals it is a genuinely useful tool against the stiffness of long sitting.\n\nHonest framing: active sitting is a supplement to movement, not a replacement for it. The included pump lets you tune wobble from subtle to demanding; the textured side doubles as a standing balance pad.",
          shortDescription:
            "Inflatable balance cushion for active sitting intervals — adjustable wobble, includes pump, doubles as a standing balance pad.",
          brand: "UprightWorks",
          sku: "ERG-BAL1",
          gtin: null,
          price: 26.95,
          compareAtPrice: null,
          cost: 7.8,
          shippingCost: 4.1,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2260",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Burst-resistant PVC, free of phthalates",
          warranty: "12-month warranty",
          returnable: true,
          pros: [
            "Recruits postural muscles static sitting switches off",
            "Inflation-adjustable difficulty",
            "Doubles as a standing balance pad",
          ],
          cons: [
            "Use in intervals — hours of continuous wobble fatigues the back",
            "Slight seat-height increase (~6 cm inflated)",
          ],
          specs: [
            { label: "Diameter", value: "33 cm" },
            { label: "Material", value: "Burst-resistant, phthalate-free PVC" },
            { label: "Max load", value: "150 kg" },
            { label: "Included", value: "Hand pump" },
          ],
          useCases: ["movement", "standing", "budget", "back-pain"],
          faq: [
            {
              question: "Can I sit on it all day?",
              answer:
                "Don't — 20-40 minute intervals a few times daily is the useful dose. Continuous use fatigues exactly the muscles you are trying to help.",
            },
          ],
          seoTitle: "Active Sitting Balance Cushion — Adjustable Wobble + Pump",
          seoDescription:
            "Inflatable balance cushion for active-sitting intervals, with honest dosage guidance (20-40 min, not all day). Pump included.",
        },
      ],
    },
    {
      slug: "desk-setup",
      name: "Desk Setup",
      description:
        "Screen and input geometry: laptop stands, monitor risers and desk converters that put the top of your screen at eye height — the single change that fixes most desk-related neck pain.",
      seoTitle: "Ergonomic Desk Setup: Stands & Risers | UprightWorks",
      seoDescription:
        "Laptop stands, monitor risers and sit-stand converters that fix screen height — the root cause of most desk neck pain. Honest setup guidance.",
      heroTitle: "Your screen is too low",
      heroSubtitle:
        "Nearly every laptop worker's screen sits 20 cm below where it should. These products fix exactly that.",
      sortOrder: 2,
      products: [
        {
          slug: "alu-laptop-stand",
          title: "Aluminium Laptop Stand",
          subtitle: "Raises your laptop screen to eye height — the #1 neck-pain fix",
          description:
            "A rigid aluminium stand that lifts your laptop screen 12-21 cm so the top of the display reaches eye height. Combined with an external keyboard (non-negotiable — typing on a raised laptop is worse than not raising it), this is the single highest-value ergonomic purchase for laptop workers.\n\nThe solid aluminium build does not bounce while you type on the desk, ventilation is improved by design, and it folds flat for bag transport.",
          shortDescription:
            "Rigid aluminium laptop stand, adjustable 12-21 cm — puts your screen at eye height. Requires an external keyboard to work properly.",
          brand: "UprightWorks",
          sku: "ERG-LAP1",
          gtin: null,
          price: 39.95,
          compareAtPrice: null,
          cost: 12.6,
          shippingCost: 5,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2310",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Anodized aluminium, silicone pads",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Fixes the root cause of most laptop neck pain",
            "Rigid — no wobble while typing on the desk",
            "Folds flat, weighs 280 g; commute-friendly",
          ],
          cons: [
            "Useless without an external keyboard and mouse — budget for them",
            "Max laptop size 16 inches",
          ],
          specs: [
            { label: "Height range", value: "12-21 cm, 6 steps" },
            { label: "Fits", value: "Laptops 10-16\", up to 5 kg" },
            { label: "Material", value: "Anodized aluminium" },
            { label: "Folded size", value: "26 × 5 × 4 cm, 280 g" },
          ],
          useCases: ["neck-pain", "monitor-height", "laptop", "compact", "budget"],
          faq: [
            {
              question: "Do I really need an external keyboard with it?",
              answer:
                "Yes. Raising the laptop without one forces your wrists up to the keyboard and trades neck pain for wrist pain. Stand + external keyboard is the complete fix.",
            },
          ],
          seoTitle: "Aluminium Laptop Stand (12-21 cm) — Fix Laptop Neck Pain",
          seoDescription:
            "Rigid foldable laptop stand that raises your screen to eye height. Honest requirement: pair it with an external keyboard or skip it.",
        },
        {
          slug: "bamboo-monitor-riser",
          title: "Bamboo Monitor Riser with Storage",
          subtitle: "Raises external monitors 10 cm and declutters the desk beneath",
          description:
            "A solid bamboo platform that raises an external monitor 10 cm — right for most people on standard desks — with a storage shelf underneath that swallows the keyboard at day's end.\n\nRule of thumb we print everywhere: the top of the screen belongs at eye height. If 10 cm is not enough (tall person, low desk), stack height with your monitor's own stand or choose an arm instead.",
          shortDescription:
            "Solid bamboo monitor riser (10 cm) with under-shelf storage — fits monitors up to 32\" and 20 kg.",
          brand: "UprightWorks",
          sku: "ERG-RISER1",
          gtin: null,
          price: 34.5,
          compareAtPrice: null,
          cost: 10.8,
          shippingCost: 6.8,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2325",
          shippingDaysMin: 7,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Solid bamboo",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Stable up to 20 kg — no flex under big monitors",
            "Under-shelf clears the keyboard off the desk overnight",
            "Solid bamboo, not veneered chipboard",
          ],
          cons: [
            "Fixed 10 cm height — measure before buying",
            "Takes 54 cm of desk width",
          ],
          specs: [
            { label: "Height", value: "10 cm fixed" },
            { label: "Platform", value: "54 × 24 cm" },
            { label: "Max load", value: "20 kg / up to 32\" monitors" },
            { label: "Material", value: "Solid bamboo" },
          ],
          useCases: ["neck-pain", "monitor-height", "typing"],
          faq: [
            {
              question: "How do I know if 10 cm is right?",
              answer:
                "Sit upright and note where your eyes hit the screen. The top edge of the display should be at eye height; measure the gap and compare with 10 cm plus your monitor's own adjustment range.",
            },
          ],
          seoTitle: "Bamboo Monitor Riser (10 cm) with Storage Shelf",
          seoDescription:
            "Solid bamboo monitor stand that raises screens 10 cm and stores your keyboard underneath. Includes the eye-height measuring rule.",
        },
        {
          slug: "sit-stand-converter",
          title: "Sit-Stand Desk Converter",
          subtitle: "Turns any desk into a standing desk — no replacement furniture",
          description:
            "A gas-spring platform that sits on your existing desk and lifts your monitor and keyboard 11-50 cm in one motion, converting any fixed desk to sit-stand without replacing furniture.\n\nThe two-tier design keeps the keyboard at elbow height in both positions — the detail cheap converters miss. Realistic standing guidance: alternate in 30-60 minute blocks; standing all day just relocates the strain.",
          shortDescription:
            "Gas-spring sit-stand converter (11-50 cm) with two-tier keyboard deck — converts any desk to standing without new furniture.",
          brand: "UprightWorks",
          sku: "ERG-CONV1",
          gtin: null,
          price: 189,
          compareAtPrice: null,
          cost: 78,
          shippingCost: 19,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2350",
          shippingDaysMin: 7,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Steel frame, MDF work surface",
          warranty: "36-month warranty on gas spring",
          returnable: true,
          pros: [
            "One-motion gas-spring lift with 12 lockable heights",
            "Separate keyboard tier keeps elbows at 90° standing or sitting",
            "No furniture replacement — sits on the existing desk",
          ],
          cons: [
            "23 kg unit; plan the unboxing",
            "Monitor wobble at full height with cheap desk underneath",
            "Footprint claims most of a 120 cm desk",
          ],
          specs: [
            { label: "Height range", value: "11-50 cm, gas-assisted" },
            { label: "Surface", value: "80 × 40 cm + keyboard deck 80 × 30 cm" },
            { label: "Max load", value: "15 kg" },
            { label: "Weight", value: "23 kg" },
          ],
          useCases: ["standing", "movement", "neck-pain", "premium", "back-pain"],
          faq: [
            {
              question: "Is standing all day better than sitting all day?",
              answer:
                "No — it trades one static posture for another. The benefit is in alternating; 30-60 minute blocks is the common-sense rhythm we recommend.",
            },
          ],
          seoTitle: "Sit-Stand Desk Converter — Gas Spring, Two-Tier Keyboard Deck",
          seoDescription:
            "Convert any desk to sit-stand: gas-spring lift, 11-50 cm range, proper keyboard tier. Honest guidance: alternate, don't just stand.",
        },
        {
          slug: "monitor-arm-single",
          title: "Single Monitor Arm, Gas Spring",
          subtitle: "Full height, depth and rotation control for monitors up to 32\"",
          description:
            "A gas-spring monitor arm that frees you from your monitor's built-in stand: fluid height, depth, tilt and rotation adjustment, plus reclaimed desk space where the stand's foot used to be.\n\nFits VESA 75/100 monitors from 2 to 9 kg (check your monitor's weight — too light is as problematic as too heavy for gas springs). Clamp and grommet mounts both included.",
          shortDescription:
            "Gas-spring monitor arm for 17-32\" VESA monitors (2-9 kg) with full motion adjustment; clamp and grommet mounts included.",
          brand: "UprightWorks",
          sku: "ERG-ARM1",
          gtin: null,
          price: 64.95,
          compareAtPrice: null,
          cost: 23.5,
          shippingCost: 7.4,
          stockStatus: "LOW_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2370",
          shippingDaysMin: 7,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "Aluminium and steel, internal gas spring",
          warranty: "36-month warranty",
          returnable: true,
          pros: [
            "Fluid one-hand positioning at any height in range",
            "Reclaims the desk space under the old stand",
            "Integrated cable channel",
          ],
          cons: [
            "Monitors under 2 kg won't hold position — check weight first",
            "Needs a desk edge or grommet hole that can take a clamp",
          ],
          specs: [
            { label: "Fits", value: "17-32\", VESA 75/100" },
            { label: "Weight range", value: "2-9 kg" },
            { label: "Motion", value: "Height, depth, ±90° tilt, 360° rotation" },
            { label: "Mount", value: "C-clamp + grommet (both included)" },
          ],
          useCases: ["neck-pain", "monitor-height", "premium", "typing"],
          faq: [
            {
              question: "Why does monitor weight matter so much?",
              answer:
                "Gas springs are tuned for a weight range. Below 2 kg the arm drifts up; above 9 kg it sags. Weigh your monitor (spec sheet, without stand) before ordering.",
            },
          ],
          seoTitle: "Gas-Spring Monitor Arm (17-32\") — Full Motion, VESA 75/100",
          seoDescription:
            "Single gas-spring monitor arm with fluid adjustment and cable management. Includes the weight-range check most shops skip.",
        },
      ],
    },
    {
      slug: "accessories",
      name: "Wrist & Accessories",
      description:
        "The finishing layer: wrist rests, ergonomic mice, desk mats and cable management that remove the small daily frictions and strains a good chair-and-screen setup leaves behind.",
      seoTitle: "Wrist Rests, Ergonomic Mice & Desk Accessories | UprightWorks",
      seoDescription:
        "Ergonomic wrist support, vertical mice and desk accessories that complete a healthy setup — with honest guidance on what each actually fixes.",
      heroTitle: "The last 10% of a good setup",
      heroSubtitle:
        "Chair right? Screen right? These accessories clean up the remaining strain points: wrists, forearms and desk chaos.",
      sortOrder: 3,
      products: [
        {
          slug: "vertical-mouse",
          title: "Vertical Ergonomic Mouse",
          subtitle: "Handshake-angle grip that unloads forearm rotation",
          description:
            "A vertical mouse holds your hand at a 57° handshake angle, removing the forearm rotation (pronation) a flat mouse forces for hours a day — the strain many people feel as wrist or elbow ache.\n\nExpect 3-5 awkward days while your aim recalibrates; nearly everyone adapts and few go back. Six buttons, adjustable DPI, silent clicks, and connection via USB receiver or Bluetooth.",
          shortDescription:
            "57° vertical mouse that removes forearm pronation strain. Six buttons, dual wireless, silent clicks — expect a 3-5 day adjustment.",
          brand: "UprightWorks",
          sku: "ERG-VMOUSE",
          gtin: null,
          price: 34.95,
          compareAtPrice: null,
          cost: 11.2,
          shippingCost: 4.2,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2410",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "ABS shell, rubberized grip",
          warranty: "24-month warranty",
          returnable: true,
          pros: [
            "Removes the constant forearm pronation of flat mice",
            "Dual wireless (USB receiver + Bluetooth)",
            "Silent clicks for shared spaces",
          ],
          cons: [
            "3-5 day precision adjustment period is real",
            "Right-handed model only at present",
            "Not ideal for pixel-precision design work during adaptation",
          ],
          specs: [
            { label: "Angle", value: "57° vertical grip" },
            { label: "Buttons", value: "6, adjustable 800-2400 DPI" },
            { label: "Connection", value: "2.4 GHz USB + Bluetooth" },
            { label: "Battery", value: "Rechargeable, ~3 weeks per charge" },
          ],
          useCases: ["wrist-pain", "typing", "budget"],
          faq: [
            {
              question: "Will I get used to it?",
              answer:
                "Almost everyone does within a week. Keep your old mouse nearby for deadline days during the transition, then it usually gathers dust.",
            },
          ],
          seoTitle: "Vertical Ergonomic Mouse — 57° Grip Against Wrist Strain",
          seoDescription:
            "Vertical mouse that unloads forearm rotation, with honest notes on the adjustment week. Dual wireless, silent clicks, 6 buttons.",
        },
        {
          slug: "memory-wrist-rest-set",
          title: "Keyboard & Mouse Wrist Rest Set",
          subtitle: "Slow-rebound foam that positions wrists without propping them",
          description:
            "A matched set: full-width keyboard rest and mouse pad with integrated rest, in slow-rebound memory foam with a cool-touch lycra surface. The role of a wrist rest is orientation, not pressure: it keeps wrists neutral between keystrokes; you should not plant them while typing.\n\nThe non-slip bases stay put, and the foam height (18 mm) matches standard and low-profile keyboards alike.",
          shortDescription:
            "Memory-foam wrist rest set (keyboard + mouse) with cool-touch surface — keeps wrists neutral between keystrokes.",
          brand: "UprightWorks",
          sku: "ERG-WRIST1",
          gtin: null,
          price: 21.95,
          compareAtPrice: null,
          cost: 6.4,
          shippingCost: 3.6,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2425",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Memory foam, lycra cover, PU base",
          warranty: null,
          returnable: true,
          pros: [
            "Keeps wrists neutral between keystrokes",
            "Cool-touch surface avoids the sweaty-foam problem",
            "Matched heights for keyboard and mouse sides",
          ],
          cons: [
            "Wrists should hover while actively typing — a rest is for the pauses",
            "18 mm height suits standard boards; very thick gaming boards may need more",
          ],
          specs: [
            { label: "Keyboard rest", value: "44 × 8.5 × 1.8 cm" },
            { label: "Mouse pad", value: "25 × 20 cm with integrated rest" },
            { label: "Foam", value: "Slow-rebound memory foam" },
          ],
          useCases: ["wrist-pain", "typing", "budget"],
          faq: [
            {
              question: "Should my wrists rest on it while typing?",
              answer:
                "No — hover while typing, rest in the pauses. Planting wrists while typing creates the bend and pressure these rests exist to prevent.",
            },
          ],
          seoTitle: "Memory Foam Wrist Rest Set — Keyboard + Mouse, Cool-Touch",
          seoDescription:
            "Matched wrist rest set with honest usage guidance: hover while typing, rest between. Slow-rebound foam, non-slip bases.",
        },
        {
          slug: "felt-desk-mat",
          title: "Wool-Felt Desk Mat 80×33",
          subtitle: "A defined, quiet work zone that doubles as a forearm cushion",
          description:
            "A dense wool-felt desk mat that softens forearm contact with hard desk edges, quiets keyboard and mouse, and visually defines the work zone — a small ritual cue that helps remote workers start and stop the day.\n\n3 mm dense felt with a recycled-PET backing that stays flat without curling. Brush or vacuum clean; spot-clean spills quickly as felt is wool.",
          shortDescription:
            "3 mm wool-felt desk mat (80 × 33 cm) that cushions forearms, quiets peripherals and defines the work zone.",
          brand: "UprightWorks",
          sku: "ERG-MAT1",
          gtin: null,
          price: 27.5,
          compareAtPrice: null,
          cost: 8.6,
          shippingCost: 4.4,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2440",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "India",
          materials: "Wool felt, recycled-PET backing",
          warranty: null,
          returnable: true,
          pros: [
            "Cushions forearms against hard desk edges",
            "Noticeably quiets keyboard and mouse",
            "Lies flat from day one (dense 3 mm felt)",
          ],
          cons: [
            "Wool needs prompt spot-cleaning on spills",
            "Optical mice work fine on it; old laser mice can struggle on felt",
          ],
          specs: [
            { label: "Size", value: "80 × 33 cm" },
            { label: "Material", value: "3 mm wool felt, recycled-PET backing" },
            { label: "Care", value: "Vacuum/brush; spot-clean spills" },
          ],
          useCases: ["typing", "wrist-pain", "budget"],
          faq: [
            {
              question: "Does a mouse track properly on felt?",
              answer:
                "Modern optical mice track well on dense felt. Very old laser sensors can be finicky — if yours is, any thin pad on top solves it.",
            },
          ],
          seoTitle: "Wool-Felt Desk Mat 80×33 — Forearm Comfort & Quiet",
          seoDescription:
            "Dense wool-felt desk mat that cushions forearms and quiets your setup. Honest compatibility note for older laser mice.",
        },
        {
          slug: "cable-management-kit",
          title: "Under-Desk Cable Management Kit",
          subtitle: "Tray, sleeves and clips that clear the cable nest in 20 minutes",
          description:
            "Cable chaos is an ergonomic issue in disguise: it blocks leg room, snags chair wheels and makes sit-stand desks unusable. This kit clears it in one session — a 40 cm steel tray that screws or clamps under the desk, two zip-up neoprene sleeves, and 20 adhesive clips.\n\nEverything reusable and re-positionable; the tray holds a power strip so one cable leaves the desk.",
          shortDescription:
            "Complete under-desk cable kit: steel tray, 2 neoprene sleeves, 20 clips — clears leg room and makes sit-stand setups practical.",
          brand: "UprightWorks",
          sku: "ERG-CABLE1",
          gtin: null,
          price: 29.95,
          compareAtPrice: null,
          cost: 9.1,
          shippingCost: 4.8,
          stockStatus: "IN_STOCK",
          supplierName: "ComfortLine Trading",
          supplierProductId: "CL-2455",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Powder-coated steel, neoprene, 3M adhesive",
          warranty: null,
          returnable: true,
          pros: [
            "Frees leg room and chair-wheel paths",
            "Essential prep for any sit-stand conversion",
            "Tray fits a full power strip — one cable to the wall",
          ],
          cons: [
            "Adhesive clips need 24 h cure time before loading",
            "Clamp mount needs a desk lip of at least 1.5 cm",
          ],
          specs: [
            { label: "Tray", value: "40 × 12 × 12 cm steel, screw or clamp mount" },
            { label: "Sleeves", value: "2 × 50 cm zip neoprene" },
            { label: "Clips", value: "20 adhesive, reusable" },
          ],
          useCases: ["standing", "movement", "budget", "compact"],
          faq: [
            {
              question: "Why does cable management matter for sit-stand desks?",
              answer:
                "Because every cable must survive the full height travel. Loose cables yank out of sockets at standing height — the tray-and-sleeve setup gives them a managed path.",
            },
          ],
          seoTitle: "Under-Desk Cable Management Kit — Tray, Sleeves & Clips",
          seoDescription:
            "Clear the cable nest in 20 minutes: steel under-desk tray, neoprene sleeves and reusable clips. Essential prep for sit-stand desks.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "fix-desk-neck-pain",
      title: "Desk Neck Pain: Find the Cause, Fix It for Under $50",
      excerpt:
        "Most desk-related neck pain traces to a screen that sits too low — typically a laptop flat on the desk. Raising the screen so its top edge reaches eye height, plus an external keyboard, fixes the geometry for under $50 in most setups.",
      body: `## The short answer

If your neck aches after screen time and you work on a laptop, the cause is almost certainly **screen height**. A laptop on the desk puts the display ~20 cm below neutral gaze, and your neck holds the difference — several extra kilograms of effective load — all day. The fix: raise the screen until its top edge is at eye height, add an external keyboard, done. In our catalog that is the aluminium laptop stand plus any keyboard you like.

## The 30-second self-diagnosis

- Sit as you normally work. Where do your eyes naturally land on the screen? If you look *down* more than slightly, the screen is too low.
- Check your shoulders: hunched forward usually follows a low screen or a desk that is too high.
- Check where the ache lives: base of the skull and upper trapezius point to screen height; between the shoulder blades often adds slouching — see the lumbar guide.

## Fix by setup type

### Laptop only

Laptop stand (raises 12-21 cm) + external keyboard and mouse. This is the under-$50-plus-keyboard fix that resolves the majority of cases. Typing on a raised laptop is *worse* than the original problem — the external keyboard is not optional.

### External monitor

The top edge belongs at eye height. Measure the gap; our 10 cm bamboo riser fits most average setups, while a gas-spring monitor arm covers any height and adds depth control (closer screen = less forward head lean).

### Two screens

Put the primary screen directly in front, secondary angled beside it. The classic mistake — both screens symmetric so you twist all day — keeps physiotherapists in business.

## What rarely helps (first)

- A new chair, when the screen is still 20 cm too low. Fix geometry top-down: screen, then arms, then seat.
- "Posture corrector" straps: passive devices that switch your muscles off rather than train them.
- Massage guns: pleasant, but they treat the symptom you re-create every workday.

## When to see a professional

Numbness or tingling in arms or hands, pain radiating below the elbow, or pain that persists for weeks after fixing the setup — clinician, not catalog. We sell desk gear, not medicine, and the distinction matters.`,
      seoTitle: "Desk Neck Pain: The Screen-Height Fix Explained (Under $50)",
      seoDescription:
        "Self-diagnose desk neck pain in 30 seconds and fix the usual cause — a too-low screen — with a stand and external keyboard. Honest non-fixes listed.",
      relatedProductSlugs: ["alu-laptop-stand", "bamboo-monitor-riser", "monitor-arm-single"],
    },
    {
      slug: "lower-back-pain-at-desk",
      title: "Lower Back Pain at the Desk: What Helps, in Order",
      excerpt:
        "Desk-related lower-back ache usually comes from unsupported slouching plus too many static hours. The fix order that works: support the lumbar curve, get feet planted, then add movement — lumbar cushion, footrest if needed, and breaks every 30-45 minutes.",
      body: `## The short answer

For typical desk-related lower-back ache: **(1) support the lumbar curve, (2) plant your feet, (3) move more often.** A lumbar cushion handles the first, a footrest the second if your feet do not rest flat, and a timer — or our balance cushion used in intervals — drives the third. Persistent or radiating pain is a clinician's job, full stop.

## Why sitting hurts backs

Upright spines hold a natural inward curve at the lower back. After 20-30 minutes of sitting, the muscles maintaining it fatigue, you slide into a C-shaped slouch, and load shifts onto passive structures — discs and ligaments — that complain by mid-afternoon. The pattern is boring and almost universal.

## Step 1: Support the curve

A contoured lumbar cushion fills the gap between your lower back and the chair so the curve survives hour three. Strap height matters: the bulge belongs in the small of your back, just above the belt line. Our contour cushion's two straps keep it there.

Reality check we publish on the product page too: a cushion improves a decent chair. It does not resurrect a chair with a collapsed backrest.

## Step 2: Plant your feet

Feet dangling or tucked under the chair tilt the pelvis and undo the lumbar support above. Quick test: seat at elbow height for the desk — do your heels lift? If yes, the tilt footrest closes the gap. If your feet already rest flat, skip this purchase; we would rather you not buy it.

## Step 3: Add movement

The best posture is the next one. Practical doses:

- Stand or walk 2-3 minutes every 30-45 minutes — calendar reminders work.
- Balance cushion in 20-40 minute intervals to keep postural muscles engaged.
- If budget allows, a sit-stand converter makes alternating effortless — alternation, not all-day standing, is the benefit.

## Spending guide

- Under $40: lumbar cushion — biggest single improvement for most.
- Under $90: + footrest or balance cushion depending on your test above.
- Around $230: + sit-stand converter for full posture rotation.

## Red flags — skip the shop, see a professional

Pain radiating down a leg, numbness or tingling, night pain, or no improvement after 2-3 weeks of better setup and movement. Desk gear addresses desk strain; it does not treat medical conditions.`,
      seoTitle: "Lower Back Pain at the Desk — The 3-Step Fix Order",
      seoDescription:
        "Support the lumbar curve, plant your feet, move every 30-45 minutes: the evidence-aware fix order for desk back ache, with honest red flags.",
      relatedProductSlugs: ["contour-lumbar-cushion", "tilt-footrest", "balance-cushion", "sit-stand-converter"],
    },
    {
      slug: "home-office-setup-budget",
      title: "The Complete Home-Office Ergonomics Setup, by Budget",
      excerpt:
        "A healthy home office is built in a fixed order — screen height, then seating support, then wrists, then movement — and the first three cost under $120 combined. Here is the exact sequence with honest skip-conditions for each purchase.",
      body: `## The short answer

Build in this order: **screen height → seating support → wrist setup → movement tools.** Each layer assumes the previous one; buying in reverse (the classic: expensive chair, laptop still flat on the desk) wastes most of the money. The first three layers together cost under $120 in our catalog.

## Layer 1: Screen height (~$40)

The non-negotiable foundation. Laptop workers: stand + external keyboard. Monitor workers: riser or arm until the top edge of the screen meets eye height. Every other purchase builds on this geometry — skip it and the rest underperforms.

## Layer 2: Seating support (~$37-79)

With the screen right, fix the chair you have before replacing it: lumbar cushion for the curve, footrest only if the heel-lift test says so (seat at elbow height — do heels lift?). A $37 cushion on a mediocre chair beats a mediocre cushion-less posture on the same chair; neither equals a genuinely good chair, which is a future upgrade, not a prerequisite.

## Layer 3: Wrists (~$22-57)

Wrist ache or forearm tightness after long days: vertical mouse (removes constant forearm rotation; allow the 3-5 day adjustment) and a wrist rest set used correctly — hover while typing, rest between bursts.

## Layer 4: Movement (~$27-219)

The layer people buy first and should buy last, because it only pays off on top of correct geometry. Balance cushion for active-sitting intervals; sit-stand converter if you want real position rotation through the day. Standing all day is not the goal — alternating is.

## Three budgets, honestly

- **$60:** laptop stand + lumbar cushion. Covers the two highest-impact fixes.
- **$130:** + vertical mouse, wrist rest set, footrest if the test says so.
- **$350:** + sit-stand converter and cable kit (sit-stand without cable management is a daily fight).

## The skip-list

Things we sell that *you* specifically might not need: footrest (feet already flat? skip), balance cushion (already exercise regularly? lower priority), desk mat (comfort, not therapy — buy it for the feel, not the back).`,
      seoTitle: "Home Office Ergonomics by Budget: The Right Buying Order",
      seoDescription:
        "Screen, seat, wrists, movement — the buying order that makes every dollar count, with three honest budget tiers and a skip-list.",
      relatedProductSlugs: ["alu-laptop-stand", "contour-lumbar-cushion", "vertical-mouse", "sit-stand-converter"],
    },
  ],
  comparison: {
    slug: "screen-height-comparison",
    title: "Screen-Height Fixes Compared: Stand vs Riser vs Arm vs Converter",
    excerpt:
      "Four ways to fix the most common desk problem: the laptop stand for laptop workers, the riser for simple monitor setups, the arm for full adjustability, the converter when you want standing too.",
    body: "All four products in this comparison solve the same root problem — a screen below eye height — at different points on the price/flexibility curve. The laptop stand is the answer if your screen is a laptop. The bamboo riser is the no-moving-parts answer for a monitor that needs about 10 cm. The gas-spring arm covers any height plus depth and rotation. The sit-stand converter solves height and adds the sit/stand rotation on top.\n\nPick by setup, not by price: an expensive converter under a screen you never stand at is the most common over-purchase we see.",
    seoTitle: "Laptop Stand vs Monitor Riser vs Arm vs Sit-Stand Converter",
    seoDescription:
      "Four screen-height fixes compared on height range, flexibility, load and price — with guidance to pick by setup, not by budget.",
    productSlugs: ["alu-laptop-stand", "bamboo-monitor-riser", "monitor-arm-single", "sit-stand-converter"],
  },
  homepageFaq: [
    {
      question: "I ache after a workday — where do I start?",
      answer:
        "Neck and shoulders: fix screen height first (usually a laptop stand plus external keyboard). Lower back: lumbar support plus movement breaks. Our two guides walk through the self-diagnosis in under a minute each.",
    },
    {
      question: "Where do orders ship from?",
      answer:
        "Directly from partner supplier warehouses, typically arriving in 6-13 business days with tracking. We publish the real window on every product page and do not claim local stock we don't hold.",
    },
    {
      question: "What is the 30-day comfort guarantee?",
      answer:
        "If a product does not improve your setup, return it within 30 days in resaleable condition for a full refund. Email care@ergonomikontor.example and we send instructions within one business day.",
    },
    {
      question: "Will a lumbar cushion fix my back pain?",
      answer:
        "It reduces the slouching strain behind much desk-related ache. Pain that radiates, tingles or persists belongs with a clinician — we say this on every relevant product page.",
    },
    {
      question: "Why no customer star ratings?",
      answer:
        "We have not collected enough verified reviews yet and will not invent them. You get measured specs, honest pros and cons, and a 30-day guarantee instead.",
    },
  ],
};

export const ergonomicPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};
