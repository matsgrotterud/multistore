import {
  defaultPrivacyPolicy,
  defaultTermsOfSale,
  type SeedStore,
  type SeedStoreInfo,
} from "./types";

/** Drone store: technical, performance-oriented brand. */

const info: SeedStoreInfo = {
  slug: "drones",
  name: "Skyforge Drones",
  legalName: "Skyforge Commerce ApS",
  primaryDomain: "dronestore.example",
  locale: "en-US",
  currency: "USD",
  niche: "consumer drones",
  positioning:
    "We test flight time, range and camera stabilization claims against real specs, then stock only the drones whose numbers hold up. Every listing shows honest delivery windows and the trade-offs other shops hide.",
  audience: "hobby pilots and aerial photo enthusiasts",
  valueProposition: "Drones specced for real flying, not marketing sheets",
  brandVoice: "technical, direct, performance-oriented",
  logoText: "SKYFORGE",
  supportEmail: "support@dronestore.example",
  supportPhone: "+1 (555) 010-7700",
  shippingOriginDisclosure:
    "Orders ship directly from our partner suppliers' warehouses in Asia and the EU. We do not hold local stock — that is how we keep prices down — and we publish the real delivery window on every product page.",
  defaultShippingDaysMin: 6,
  defaultShippingDaysMax: 14,
  returnPolicySummary:
    "30-day returns on unflown drones in original packaging; defective units are replaced or refunded at our cost.",
};

export const dronesSeed: SeedStore = {
  store: info,
  theme: {
    primaryColor: "#0284c7",
    secondaryColor: "#0c1c2e",
    accentColor: "#f59e0b",
    backgroundColor: "#f6f9fc",
    textColor: "#0f172a",
    borderRadius: "0.5rem",
    fontHeading: "geometric",
    fontBody: "system-ui",
  },
  domains: ["dronestore.example", "www.dronestore.example"],
  categories: [
    {
      slug: "camera-drones",
      name: "Camera Drones",
      description:
        "GPS camera drones compared on the numbers that matter: stabilized resolution, real-world flight time, transmission range and takeoff weight. We list the certification-relevant weight class for every model.",
      seoTitle: "Camera Drones with Honest Specs | Skyforge Drones",
      seoDescription:
        "Compare 4K and 1080p camera drones on real flight time, range and gimbal stabilization. Transparent supplier shipping and 30-day returns.",
      heroTitle: "Camera drones, specced honestly",
      heroSubtitle:
        "Stabilization, flight time and range as measured — with the under-250 g models clearly marked for easier regulation compliance.",
      sortOrder: 1,
      products: [
        {
          slug: "aero-s1-mini-4k",
          title: "Aero S1 Mini 4K Foldable Drone",
          subtitle: "Sub-250 g with 3-axis stabilized 4K and GPS return-to-home",
          description:
            "The Aero S1 Mini is the drone we recommend most often: under 249 g takeoff weight (no registration in many regions — check your local rules), a genuinely stabilized 4K/30 camera on a 3-axis gimbal, and 28 minutes of measured hover time per battery.\n\nGPS hold and automatic return-to-home make it forgiving for first-time pilots, while manual exposure and RAW stills keep it interesting once you outgrow auto mode. The folded footprint fits a jacket pocket.",
          shortDescription:
            "Sub-250 g foldable drone with 3-axis stabilized 4K/30 camera, GPS return-to-home and 28 minutes of real flight time per battery.",
          brand: "Aero",
          sku: "DRN-S1MINI",
          gtin: null,
          price: 289,
          compareAtPrice: null,
          cost: 96,
          shippingCost: 9.5,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4410",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "ABS/PC composite airframe",
          warranty: "12-month manufacturer warranty",
          returnable: true,
          pros: [
            "Under 249 g — lighter regulation burden in many regions",
            "True 3-axis gimbal, not electronic-only stabilization",
            "28 min measured hover time, 6 km video transmission",
            "RAW photo support for editing flexibility",
          ],
          cons: [
            "No obstacle avoidance sensors at this price",
            "Struggles in winds above ~10 m/s due to low weight",
            "Spare batteries are a near-mandatory extra purchase",
          ],
          specs: [
            { label: "Takeoff weight", value: "249 g" },
            { label: "Camera", value: "4K/30fps, 1/2.3\" sensor, 3-axis gimbal" },
            { label: "Flight time", value: "28 min per battery (measured hover)" },
            { label: "Transmission range", value: "6 km (FCC), line of sight" },
            { label: "Max wind resistance", value: "Level 4 (~8 m/s)" },
            { label: "Folded size", value: "140 × 82 × 57 mm" },
          ],
          useCases: ["beginner", "camera", "4k", "outdoor", "gps", "compact", "easy-fly"],
          faq: [
            {
              question: "Do I need to register this drone?",
              answer:
                "At 249 g it falls under the lighter registration regimes in many countries, but rules differ and change — always check your national aviation authority before flying.",
            },
            {
              question: "How many batteries do I need?",
              answer:
                "One battery gives about 28 minutes. Most pilots are happiest with three; see the Aero Flight Battery 2-Pack in accessories.",
            },
          ],
          seoTitle: "Aero S1 Mini 4K Drone (Sub-250 g) — Real Specs & Price",
          seoDescription:
            "Aero S1 Mini: 249 g foldable drone with 3-axis 4K gimbal, 28 min flight time and 6 km range. Honest pros, cons and delivery times.",
        },
        {
          slug: "aero-x8-pro",
          title: "Aero X8 Pro Camera Drone",
          subtitle: "1-inch sensor, 45-minute flight time, omnidirectional sensing",
          description:
            "The X8 Pro is for pilots who have outgrown entry-level drones. Its 1-inch 20 MP sensor shoots 5.4K/30 and genuinely usable low-light footage, and the 45-minute flight time means you stop planning flights around battery anxiety.\n\nOmnidirectional obstacle sensing and a 15 km transmission link make longer, more ambitious flights practical. It is heavier than 250 g, so expect registration and stricter rules in most regions.",
          shortDescription:
            "Prosumer camera drone with 1-inch 20 MP sensor, 5.4K video, 45 min flight time and omnidirectional obstacle sensing.",
          brand: "Aero",
          sku: "DRN-X8PRO",
          gtin: null,
          price: 1049,
          compareAtPrice: null,
          cost: 540,
          shippingCost: 18,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4480",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Magnesium-aluminium alloy frame",
          warranty: "12-month manufacturer warranty",
          returnable: true,
          pros: [
            "1-inch sensor with noticeably better dynamic range and low light",
            "45-minute real-world flight time",
            "Omnidirectional obstacle sensing for safer automated flight",
            "15 km O3-class transmission link",
          ],
          cons: [
            "895 g — registration and stricter rules apply in most regions",
            "Significant investment; overkill for casual weekend flying",
            "ND filter set needed for cinematic shutter speeds, sold separately",
          ],
          specs: [
            { label: "Takeoff weight", value: "895 g" },
            { label: "Camera", value: "5.4K/30, 1\" CMOS 20 MP, 3-axis gimbal" },
            { label: "Flight time", value: "45 min per battery" },
            { label: "Transmission range", value: "15 km (FCC)" },
            { label: "Obstacle sensing", value: "Omnidirectional" },
            { label: "Internal storage", value: "8 GB + microSD" },
          ],
          useCases: ["pro", "performance", "camera", "4k", "outdoor", "gps"],
          faq: [
            {
              question: "Is the X8 Pro worth it over the S1 Mini?",
              answer:
                "If you sell footage, fly in low light or need obstacle sensing for complex shots — yes. For travel memories and hobby flying, the S1 Mini covers 90% of use cases at a quarter of the price.",
            },
          ],
          seoTitle: "Aero X8 Pro — 1-Inch Sensor Drone with 45 Min Flight Time",
          seoDescription:
            "Aero X8 Pro prosumer drone: 5.4K video from a 1-inch sensor, omnidirectional sensing, 45 min flight time. Real specs and honest trade-offs.",
        },
        {
          slug: "aero-lite-2",
          title: "Aero Lite 2 Beginner Drone",
          subtitle: "Stabilized 1080p, GPS hold and one-key landing under $150",
          description:
            "The Lite 2 is our honest budget pick. The 1080p camera is electronically stabilized — fine for sharing clips, not for cinematic work — and GPS position hold plus one-key takeoff and landing make the first flights stress-free.\n\nAt this price you give up a gimbal and long range, but you get a tough, repairable airframe and 22 minutes of flight per charge, which beats most toy-grade drones by a wide margin.",
          shortDescription:
            "Budget GPS drone with electronically stabilized 1080p camera, 22 min flight time and one-key takeoff and landing.",
          brand: "Aero",
          sku: "DRN-LITE2",
          gtin: null,
          price: 139,
          compareAtPrice: null,
          cost: 46,
          shippingCost: 7,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-1001",
          shippingDaysMin: 6,
          shippingDaysMax: 13,
          countryOfOrigin: "China",
          materials: "ABS airframe",
          warranty: "6-month manufacturer warranty",
          returnable: true,
          pros: [
            "GPS hold and return-to-home rarely seen under $150",
            "22 min flight time per charge",
            "Cheap, widely available spare parts",
          ],
          cons: [
            "Electronic stabilization only — visible jello in wind",
            "1080p camera is for fun clips, not serious footage",
            "2 km range in ideal conditions, less in cities",
          ],
          specs: [
            { label: "Takeoff weight", value: "245 g" },
            { label: "Camera", value: "1080p/30, electronic stabilization" },
            { label: "Flight time", value: "22 min per battery" },
            { label: "Transmission range", value: "2 km (line of sight)" },
            { label: "Features", value: "GPS hold, one-key takeoff/landing, RTH" },
          ],
          useCases: ["budget", "beginner", "easy-fly", "camera", "outdoor", "gps"],
          faq: [
            {
              question: "Is this a toy drone?",
              answer:
                "No — it has GPS position hold and return-to-home, which toy drones lack. But the camera is hobby-grade; if footage quality matters, look at the S1 Mini instead.",
            },
          ],
          seoTitle: "Aero Lite 2 — Best Beginner GPS Drone Under $150",
          seoDescription:
            "Aero Lite 2 budget drone: GPS hold, return-to-home, 22 min flight time and stabilized 1080p. Honest review of what you get under $150.",
        },
        {
          slug: "aero-trail-explorer",
          title: "Aero Trail Explorer Drone",
          subtitle: "Rugged sub-400 g travel drone with 2.7K camera and quick-swap props",
          description:
            "Built for hikers and travelers: the Trail Explorer trades outright camera quality for durability and packability. The reinforced arms survive the tumbles that crack lighter airframes, and tool-free quick-swap propellers mean a rough landing does not end the trip.\n\nThe 2.7K camera on a single-axis gimbal with electronic roll correction produces stable, share-ready footage, and the controller doubles as a power bank for your phone.",
          shortDescription:
            "Rugged 390 g travel drone with 2.7K camera, quick-swap props, 26 min flight time and a controller that doubles as a power bank.",
          brand: "Aero",
          sku: "DRN-TRAIL",
          gtin: null,
          price: 329,
          compareAtPrice: null,
          cost: 128,
          shippingCost: 10,
          stockStatus: "LOW_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4452",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Glass-fiber reinforced nylon arms, ABS body",
          warranty: "12-month manufacturer warranty",
          returnable: true,
          pros: [
            "Reinforced arms shrug off crashes that break lighter drones",
            "Tool-free propeller swaps in the field",
            "Controller doubles as a USB-C power bank",
          ],
          cons: [
            "Hybrid stabilization is a step below a full 3-axis gimbal",
            "390 g — above the lightest regulation class",
            "Currently low stock with our supplier",
          ],
          specs: [
            { label: "Takeoff weight", value: "390 g" },
            { label: "Camera", value: "2.7K/30, 1-axis gimbal + EIS" },
            { label: "Flight time", value: "26 min per battery" },
            { label: "Transmission range", value: "5 km (FCC)" },
            { label: "Special", value: "Quick-swap props, power-bank controller" },
          ],
          useCases: ["outdoor", "compact", "camera", "gps", "beginner"],
          faq: [
            {
              question: "How crash-resistant is it really?",
              answer:
                "The arms are glass-fiber reinforced and the props swap without tools. It survives grass and dirt tumbles well; concrete at speed will still break things — that is physics, not marketing.",
            },
          ],
          seoTitle: "Aero Trail Explorer — Rugged Travel Drone with 2.7K Camera",
          seoDescription:
            "Aero Trail Explorer: crash-tolerant 390 g travel drone, 2.7K stabilized camera, 26 min flight time, quick-swap props. Real specs and trade-offs.",
        },
      ],
    },
    {
      slug: "fpv-racing",
      name: "FPV & Racing",
      description:
        "First-person-view kit for pilots who want speed and immersion: ready-to-fly bundles, indoor micro whoops, goggles and freestyle frames. We state video latency and battery sag honestly — they decide races.",
      seoTitle: "FPV Drones, Goggles & Racing Gear | Skyforge Drones",
      seoDescription:
        "FPV starter kits, micro whoops, goggles and racing frames with honest latency and flight-time numbers. Transparent shipping, 30-day returns.",
      heroTitle: "FPV that tells you the latency",
      heroSubtitle:
        "Starter kits and racing gear specced with the numbers that decide races: video latency, battery sag and real flight weight.",
      sortOrder: 2,
      products: [
        {
          slug: "volt-fpv-starter-kit",
          title: "Volt FPV Starter Kit",
          subtitle: "Ready-to-fly 3.5-inch FPV drone with goggles and controller",
          description:
            "Everything needed for a first FPV flight in one box: a durable 3.5-inch quad, digital goggles with a 28 ms latency feed, a hall-sensor controller and two batteries. The flight controller ships with beginner, sport and full acro modes so the kit grows with you.\n\nFPV has a learning curve — expect to spend hours in a simulator (the controller plugs into your PC via USB-C) before confident acro flying. The kit is the cheapest honest way in that does not need replacing after a month.",
          shortDescription:
            "Complete ready-to-fly FPV kit: 3.5-inch quad, digital goggles (28 ms latency), hall-sensor controller and two batteries.",
          brand: "Volt",
          sku: "DRN-VFPVKIT",
          gtin: null,
          price: 419,
          compareAtPrice: null,
          cost: 198,
          shippingCost: 14,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-5101",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "Carbon fiber frame, TPU mounts",
          warranty: "6-month warranty on electronics",
          returnable: true,
          pros: [
            "Genuinely complete kit — nothing extra needed for first flights",
            "Digital video link at 28 ms latency",
            "Controller doubles as a USB simulator stick",
            "Beginner/sport/acro modes to grow into",
          ],
          cons: [
            "FPV has a real learning curve; budget simulator hours",
            "3.5-inch props need open space — not a living-room drone",
            "Crash repairs are part of the hobby; budget for spares",
          ],
          specs: [
            { label: "Quad size", value: "3.5-inch props, 280 g with battery" },
            { label: "Video system", value: "Digital, 28 ms latency, 10 km max" },
            { label: "Flight time", value: "7-9 min per battery (freestyle)" },
            { label: "Controller", value: "Hall-sensor gimbals, USB-C sim mode" },
            { label: "Batteries included", value: "2 × 4S 850 mAh LiPo" },
          ],
          useCases: ["racing", "performance", "beginner", "outdoor"],
          faq: [
            {
              question: "Can I learn FPV without crashing expensive gear?",
              answer:
                "Yes — plug the included controller into a PC simulator first. Twenty hours of sim time saves most of the early repair bills.",
            },
          ],
          seoTitle: "Volt FPV Starter Kit — Complete RTF FPV Bundle with Goggles",
          seoDescription:
            "Volt FPV starter kit: 3.5-inch quad, 28 ms digital goggles, sim-ready controller, 2 batteries. Honest learning-curve advice included.",
        },
        {
          slug: "volt-micro-whoop",
          title: "Volt Micro Whoop Indoor FPV",
          subtitle: "65 mm ducted indoor quad — learn FPV in your living room",
          description:
            "The micro whoop is how most FPV pilots actually learn: a 25-gram ducted quad that bounces off walls, furniture and family members without damage. Fly line-of-sight or pair it with any analog goggles.\n\nFour-minute packs sound short, but with six included batteries and a four-slot charger you get continuous practice sessions. This is the lowest-risk entry into FPV flying we know of.",
          shortDescription:
            "25 g ducted indoor FPV quad with analog VTX, six batteries and a 4-slot charger — the classic low-risk way to learn FPV.",
          brand: "Volt",
          sku: "DRN-VWHOOP",
          gtin: null,
          price: 95,
          compareAtPrice: null,
          cost: 34,
          shippingCost: 5.5,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2031",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "PA12 ducted frame",
          warranty: "3-month warranty on electronics",
          returnable: true,
          pros: [
            "Safe indoors — ducts protect props, people and furniture",
            "Six batteries + multi-charger included for long sessions",
            "Binds to most common analog goggles and radios",
          ],
          cons: [
            "About 4 minutes per battery",
            "Analog video only at this price",
            "Outdoor flying limited to calm days",
          ],
          specs: [
            { label: "Weight", value: "25 g with battery" },
            { label: "Frame", value: "65 mm ducted" },
            { label: "Video", value: "Analog 25 mW VTX" },
            { label: "Flight time", value: "~4 min per 300 mAh 1S pack" },
            { label: "Included", value: "6 batteries, 4-slot USB charger" },
          ],
          useCases: ["indoor", "racing", "beginner", "easy-fly", "budget", "compact"],
          faq: [
            {
              question: "Do I need goggles to fly it?",
              answer:
                "No — it flies line-of-sight out of the box. Add any analog FPV goggles later for the full first-person experience.",
            },
          ],
          seoTitle: "Volt Micro Whoop — Indoor FPV Quad with 6 Batteries",
          seoDescription:
            "Volt Micro Whoop: 25 g ducted indoor FPV drone, six batteries included, safe around furniture. The proven low-risk way to learn FPV.",
        },
        {
          slug: "volt-r5-freestyle-frame",
          title: "Volt R5 Freestyle Frame Kit",
          subtitle: "5-inch carbon freestyle frame with crash-replaceable arms",
          description:
            "A 5-inch freestyle frame for pilots building their own quad: 6 mm arms in T700 carbon, replaceable individually with four screws each, and a stack bay that fits 20×20 and 30.5×30.5 mounting patterns.\n\nThis is a frame kit only — motors, stack, VTX and receiver are up to you. The geometry favors smooth freestyle lines over outright racing stiffness, and all hardware is standard metric.",
          shortDescription:
            "T700 carbon 5-inch freestyle frame with individually replaceable 6 mm arms and 20/30.5 mm stack compatibility. Frame kit only.",
          brand: "Volt",
          sku: "DRN-VR5FRAME",
          gtin: null,
          price: 64,
          compareAtPrice: null,
          cost: 21,
          shippingCost: 4.5,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2044",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "T700 carbon fiber, stainless hardware",
          warranty: null,
          returnable: true,
          pros: [
            "Arms replace individually — cheap crash repairs",
            "True T700 carbon, 116 g frame weight",
            "Fits standard 20×20 and 30.5×30.5 stacks",
          ],
          cons: [
            "Frame only — full build requires separate electronics",
            "Freestyle geometry, not optimized for pure racing",
          ],
          specs: [
            { label: "Frame size", value: "5-inch, 225 mm wheelbase" },
            { label: "Arm thickness", value: "6 mm, individually replaceable" },
            { label: "Weight", value: "116 g frame only" },
            { label: "Stack mounting", value: "20×20 and 30.5×30.5 mm" },
            { label: "Camera mount", value: "19-21 mm micro, adjustable tilt" },
          ],
          useCases: ["racing", "pro", "performance"],
          faq: [
            {
              question: "Is this a complete drone?",
              answer:
                "No — it is the carbon frame and hardware only. You add motors, flight stack, video system and receiver. Our FPV starter kit is the ready-to-fly option.",
            },
          ],
          seoTitle: "Volt R5 Freestyle Frame — 5-Inch T700 Carbon Frame Kit",
          seoDescription:
            "Volt R5 5-inch freestyle frame: T700 carbon, replaceable 6 mm arms, standard stack mounting. Honest note: frame kit only, electronics separate.",
        },
        {
          slug: "volt-vision-goggles",
          title: "Volt Vision FPV Goggles",
          subtitle: "Analog goggles with DVR, diversity receivers and glasses-friendly fit",
          description:
            "Solid analog goggles for whoop and budget FPV pilots: dual diversity receivers hold signal where single-antenna boxes drop out, the built-in DVR records every flight to microSD, and the optics leave room for most glasses.\n\nThese are analog goggles — they will not receive digital video systems. For the price of one digital headset you can equip yourself and a friend, which is exactly how most people get hooked.",
          shortDescription:
            "Analog FPV goggles with dual diversity receivers, onboard DVR recording and a glasses-friendly fit.",
          brand: "Volt",
          sku: "DRN-VGOGGLE",
          gtin: null,
          price: 129,
          compareAtPrice: null,
          cost: 48,
          shippingCost: 6,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-5130",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "ABS shell, foam faceplate",
          warranty: "6-month warranty",
          returnable: true,
          pros: [
            "Dual diversity receivers — fewer signal dropouts",
            "Built-in DVR records flights to microSD",
            "Fits over most glasses",
          ],
          cons: [
            "Analog only — incompatible with digital video systems",
            "Box-style goggles are bulkier than low-profile designs",
          ],
          specs: [
            { label: "Screen", value: "4.3\" LCD, 800×480" },
            { label: "Receiver", value: "5.8 GHz, 48ch, dual diversity" },
            { label: "DVR", value: "Onboard, microSD up to 128 GB" },
            { label: "Battery", value: "Built-in 2000 mAh, ~2.5 h" },
            { label: "Weight", value: "385 g" },
          ],
          useCases: ["racing", "indoor", "budget", "beginner"],
          faq: [
            {
              question: "Will these work with the Micro Whoop?",
              answer:
                "Yes — the whoop's analog VTX pairs directly with these goggles. They will not work with digital-only quads like the one in our FPV starter kit.",
            },
          ],
          seoTitle: "Volt Vision FPV Goggles — Analog Diversity Goggles with DVR",
          seoDescription:
            "Volt Vision analog FPV goggles: dual diversity receivers, built-in DVR, glasses-friendly. Honest compatibility notes for whoop pilots.",
        },
      ],
    },
    {
      slug: "accessories",
      name: "Accessories",
      description:
        "The unglamorous gear that decides whether a flying day succeeds: spare batteries, propellers, landing pads and transport cases — matched to the drones we sell so compatibility is never a guess.",
      seoTitle: "Drone Accessories: Batteries, Props & Cases | Skyforge Drones",
      seoDescription:
        "Spare drone batteries, propeller sets, landing pads and hard cases — compatibility clearly listed for every Aero and Volt model we stock.",
      heroTitle: "Accessories that match your drone",
      heroSubtitle:
        "Compatibility stated explicitly on every item — no guessing whether a battery or prop set fits your model.",
      sortOrder: 3,
      products: [
        {
          slug: "aero-flight-battery-2-pack",
          title: "Aero Flight Battery 2-Pack",
          subtitle: "Two genuine S1 Mini batteries — doubles your session to ~84 minutes",
          description:
            "Two genuine Aero intelligent flight batteries for the S1 Mini, with onboard charge-level LEDs and storage-mode self-discharge that protects cell health when you fly less often.\n\nThree batteries total (the one in your drone plus these two) is the setup most S1 Mini pilots settle on: roughly 84 minutes of combined flight time per outing.",
          shortDescription:
            "Two genuine Aero S1 Mini intelligent batteries with charge LEDs and storage self-discharge. Compatible with S1 Mini only.",
          brand: "Aero",
          sku: "DRN-S1BAT2",
          gtin: null,
          price: 79,
          compareAtPrice: null,
          cost: 31,
          shippingCost: 6,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4610",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Li-ion cells, PC housing",
          warranty: "6-month warranty",
          returnable: true,
          pros: [
            "Genuine cells with the same 28 min runtime as the original",
            "Auto storage mode protects cells between sessions",
            "Charge-level LEDs on the pack",
          ],
          cons: [
            "Fits the Aero S1 Mini only",
            "Air-shipping rules for lithium batteries can add transit time",
          ],
          specs: [
            { label: "Compatibility", value: "Aero S1 Mini only" },
            { label: "Capacity", value: "2453 mAh per battery" },
            { label: "Flight time", value: "~28 min per battery" },
            { label: "Charge time", value: "~70 min each" },
          ],
          useCases: ["outdoor", "camera", "beginner"],
          faq: [
            {
              question: "Why does battery shipping sometimes take longer?",
              answer:
                "Lithium batteries move under stricter air-freight rules, which can add a few days. The window shown here already accounts for it.",
            },
          ],
          seoTitle: "Aero S1 Mini Battery 2-Pack — Genuine Flight Batteries",
          seoDescription:
            "Double your Aero S1 Mini flight time with two genuine intelligent batteries: 2453 mAh, storage mode, charge LEDs. Compatibility clearly stated.",
        },
        {
          slug: "aero-low-noise-props",
          title: "Aero Low-Noise Propeller Set",
          subtitle: "Four pairs of swept-tip props for the S1 Mini — quieter and balanced",
          description:
            "Replacement propellers wear out faster than anything else on a drone. This set gives you four pairs of swept-tip low-noise props for the S1 Mini, factory-balanced so you avoid the micro-vibrations that show up as jello in footage.\n\nThe swept tips reduce the characteristic drone whine noticeably — useful for wildlife shots and not annoying everyone at the park.",
          shortDescription:
            "Four pairs of factory-balanced, swept-tip low-noise propellers for the Aero S1 Mini, with mounting screws and tool.",
          brand: "Aero",
          sku: "DRN-S1PROPS",
          gtin: null,
          price: 19,
          compareAtPrice: null,
          cost: 5.2,
          shippingCost: 2.8,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2102",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Glass-fiber reinforced nylon",
          warranty: null,
          returnable: true,
          pros: [
            "Factory-balanced — no jello from vibrating props",
            "Noticeably quieter swept-tip design",
            "Includes screws and driver",
          ],
          cons: ["Fits the Aero S1 Mini only"],
          specs: [
            { label: "Compatibility", value: "Aero S1 Mini" },
            { label: "Contents", value: "4 pairs (8 props), screws, driver" },
            { label: "Material", value: "GF-reinforced nylon" },
          ],
          useCases: ["outdoor", "camera", "budget"],
          faq: [
            {
              question: "How often should props be replaced?",
              answer:
                "Inspect before every flight; replace at any nick or chip. Damaged props cause vibration that degrades footage and stresses motors.",
            },
          ],
          seoTitle: "Aero S1 Mini Low-Noise Props — 4-Pair Replacement Set",
          seoDescription:
            "Balanced low-noise propeller set for the Aero S1 Mini: 4 pairs, swept tips, screws and tool included. Why and when to replace props, explained.",
        },
        {
          slug: "skyforge-landing-pad-75",
          title: "Skyforge Landing Pad 75 cm",
          subtitle: "Foldable double-sided pad — protects gimbals from dust and grass",
          description:
            "Sand, dust and wet grass end more gimbal motors than crashes do. This 75 cm pad folds to a third of its size, spring-opens in a second, and anchors with the included stakes on windy days.\n\nThe double-sided high-contrast print (orange/blue) also gives vision-positioning drones a clean texture to lock onto during takeoff and landing.",
          shortDescription:
            "75 cm foldable landing pad with ground stakes and high-contrast double-sided print — cheap insurance for camera drone gimbals.",
          brand: "Skyforge",
          sku: "DRN-PAD75",
          gtin: null,
          price: 24,
          compareAtPrice: null,
          cost: 7.5,
          shippingCost: 3.5,
          stockStatus: "IN_STOCK",
          supplierName: "MockSupply Co",
          supplierProductId: "MS-2110",
          shippingDaysMin: 6,
          shippingDaysMax: 12,
          countryOfOrigin: "China",
          materials: "Oxford polyester, spring-steel frame",
          warranty: null,
          returnable: true,
          pros: [
            "Protects gimbal and motors from dust and moisture",
            "Spring-open design, packs flat in seconds",
            "Stakes included for windy ground",
          ],
          cons: ["75 cm suits sub-1 kg drones; large rigs need the 110 cm class"],
          specs: [
            { label: "Diameter", value: "75 cm open, 28 cm folded" },
            { label: "Material", value: "Waterproof Oxford polyester" },
            { label: "Included", value: "3 stakes, carry bag" },
          ],
          useCases: ["outdoor", "beginner", "budget"],
          faq: [
            {
              question: "Do I actually need a landing pad?",
              answer:
                "On clean concrete, no. On grass, sand, dust or snow — yes: debris ingestion is one of the most common gimbal and motor failure causes.",
            },
          ],
          seoTitle: "Skyforge 75 cm Drone Landing Pad — Foldable, Double-Sided",
          seoDescription:
            "Foldable 75 cm landing pad with stakes and high-contrast print. Why landing pads prevent the most common gimbal failures, explained honestly.",
        },
        {
          slug: "skyforge-hard-case",
          title: "Skyforge Hard Case for S1 Mini",
          subtitle: "IP67 case with custom foam for drone, 3 batteries and controller",
          description:
            "A crushproof, IP67 water-sealed case cut specifically for the S1 Mini kit: drone, controller, three batteries, charger, props and filters each get a dedicated foam cavity, so nothing rattles in a car boot or checked luggage.\n\nThe pressure-equalization valve makes it flight-safe, and the lid accepts standard padlocks for travel.",
          shortDescription:
            "IP67 crushproof hard case with custom-cut foam for the Aero S1 Mini, controller, 3 batteries and accessories.",
          brand: "Skyforge",
          sku: "DRN-CASE1",
          gtin: null,
          price: 84,
          compareAtPrice: null,
          cost: 29,
          shippingCost: 9,
          stockStatus: "IN_STOCK",
          supplierName: "SkyTech Wholesale",
          supplierProductId: "ST-4720",
          shippingDaysMin: 7,
          shippingDaysMax: 14,
          countryOfOrigin: "China",
          materials: "PP copolymer shell, PE foam insert",
          warranty: "24-month warranty on shell",
          returnable: true,
          pros: [
            "IP67 sealed and crushproof",
            "Custom foam — nothing moves in transit",
            "Pressure valve for air travel, padlock-ready",
          ],
          cons: [
            "Foam layout fits the S1 Mini kit only",
            "Heavier than soft bags (1.4 kg empty)",
          ],
          specs: [
            { label: "Rating", value: "IP67, crushproof to 120 kg" },
            { label: "Fits", value: "S1 Mini, controller, 3 batteries, charger" },
            { label: "Weight", value: "1.4 kg empty" },
            { label: "External size", value: "32 × 27 × 13 cm" },
          ],
          useCases: ["outdoor", "compact", "camera"],
          faq: [
            {
              question: "Can it go in checked airline luggage?",
              answer:
                "The case is built for it, but airlines require lithium batteries in carry-on. Pack the case in checked luggage and the batteries in your cabin bag.",
            },
          ],
          seoTitle: "Skyforge IP67 Hard Case for Aero S1 Mini — Custom Foam",
          seoDescription:
            "Crushproof IP67 case with custom foam for the Aero S1 Mini kit. Includes honest airline guidance: batteries belong in carry-on.",
        },
      ],
    },
  ],
  guides: [
    {
      slug: "best-beginner-drone",
      title: "How to Choose Your First Drone (Without Wasting Money)",
      excerpt:
        "For most beginners the right first drone is a sub-250 g GPS camera drone like the Aero S1 Mini: light enough for relaxed rules, stabilized enough that footage looks good, forgiving enough that mistakes rarely end in losses. Pay for GPS hold and a real gimbal; skip obstacle sensing until you know you need it.",
      body: `## The short answer

If you want good footage with minimal regulatory hassle, buy a **sub-250 g GPS drone with a real 3-axis gimbal** — in our catalog that is the Aero S1 Mini. If you mainly want the fun of flying and your budget is tight, the Aero Lite 2 keeps the GPS safety net for under $150. If the goal is adrenaline rather than footage, skip camera drones entirely and start FPV with a micro whoop.

## The three questions that actually decide it

- **Footage or flying?** Camera drones fly themselves so you can frame shots. FPV drones are flown for the flying itself. They are different hobbies that happen to share propellers.
- **Where will you fly?** Sub-250 g drones face lighter rules in many countries. Above that weight, expect registration, tests and more restricted zones. Check your aviation authority — rules change.
- **What is the real budget?** Add roughly 30% to any drone's sticker price for spare batteries and a case. A $289 drone is a $370 setup. Budgeting this up front beats being grounded after 28 minutes on a perfect evening.

## What matters in the spec sheet

- **Gimbal type.** A mechanical 3-axis gimbal produces smooth footage; "electronic stabilization" crops your image and shows jello in wind. This single line in the spec sheet explains most of the price difference between the Lite 2 and the S1 Mini.
- **Flight time per battery.** Treat manufacturer numbers as hover-in-a-lab values; real flying costs 10-15% more. Anything under 20 minutes gets frustrating fast.
- **Transmission range.** You must legally keep line of sight almost everywhere, so a 6 km link is not about flying 6 km away — it is about a rock-solid connection at 500 m.

## What does not matter (yet)

- **Obstacle avoidance** is genuinely useful but expensive; careful flying replaces it while you learn. It becomes worth paying for when you fly complex automated shots — that is X8 Pro territory.
- **8K video** on a tiny sensor is marketing. A good 4K image from a 1/2.3-inch sensor beats a noisy 8K one every time.

## Best for each budget

- **Under $150:** Aero Lite 2 — GPS hold and return-to-home make it a real aircraft, not a toy. Accept hobby-grade footage.
- **Around $300:** Aero S1 Mini — the sweet spot. Real gimbal, sub-250 g, RAW photos.
- **Serious footage:** Aero X8 Pro — 1-inch sensor and obstacle sensing, but only worth it if footage quality has concrete value to you.

## The mistakes we see most

- Buying a toy-grade drone without GPS "to learn on" — it teaches bad habits and usually ends up in a tree.
- Skipping spare batteries, then planning every outing around 28 airborne minutes.
- Ignoring local rules. Five minutes on your aviation authority's site prevents real fines.`,
      seoTitle: "Best Beginner Drone 2026: How to Choose Without Wasting Money",
      seoDescription:
        "A direct answer to which drone to buy first: why sub-250 g GPS drones with real gimbals win, what specs are marketing, and best picks per budget.",
      relatedProductSlugs: ["aero-s1-mini-4k", "aero-lite-2", "aero-flight-battery-2-pack"],
    },
    {
      slug: "drone-camera-specs-explained",
      title: "Drone Camera Specs Explained: What Actually Affects Your Footage",
      excerpt:
        "Sensor size and gimbal type determine your footage quality far more than resolution. A 4K camera on a 1-inch sensor with a 3-axis gimbal beats an '8K' camera on a tiny sensor with electronic stabilization in every real-world condition — here is how to read the spec sheet.",
      body: `## The short answer

Read drone camera specs in this order: **gimbal type, sensor size, then resolution**. A mechanical 3-axis gimbal and a larger sensor improve every shot you take; extra resolution only helps when the first two are already good.

## Gimbal: the spec that hides in the footnotes

A mechanical gimbal physically isolates the camera from the airframe's vibration and tilt. Electronic stabilization (EIS) instead crops into the image and shifts it digitally — it works for casual clips in calm air and falls apart in wind. Marketing copy blurs this line constantly; the honest phrasing to look for is "3-axis mechanical gimbal".

- Aero S1 Mini and X8 Pro: mechanical 3-axis gimbals.
- Aero Trail Explorer: hybrid (1-axis mechanical + EIS) — a fair middle ground.
- Aero Lite 2: EIS only, priced accordingly.

## Sensor size beats megapixels

Sensor area determines how much light the camera gathers, which controls noise, dynamic range and low-light usability. The jump from a 1/2.3-inch sensor to a 1-inch sensor is roughly four times the light-gathering area — visible in every dusk shot. Megapixels divide that same light into smaller buckets; more is not automatically better.

## Resolution: when 4K matters

4K is worth having: it lets you crop and stabilize in post while delivering sharp 1080p. Beyond 4K, gains are real only for professional delivery or heavy cropping. "8K" from a tiny sensor mostly produces bigger files of the same noise.

## Frame rates and shutter

For smooth cinematic motion you want your shutter at roughly double the frame rate, which in daylight requires ND filters — budget for a set if you shoot seriously. 60 fps modes are for slow-motion or fast action; 24-30 fps is the standard look.

## What this means per pilot type

- **Social clips and travel memories:** any stabilized 4K is plenty — S1 Mini class.
- **Selling footage or printing stills:** 1-inch sensor minimum — X8 Pro class, plus ND filters.
- **Just learning:** the Lite 2's EIS footage is fine while you decide whether the hobby sticks.`,
      seoTitle: "Drone Camera Specs Explained: Gimbal, Sensor Size & 4K Truths",
      seoDescription:
        "Why gimbal type and sensor size matter more than resolution, which specs are marketing, and what camera class fits travel clips vs paid work.",
      relatedProductSlugs: ["aero-x8-pro", "aero-s1-mini-4k", "aero-trail-explorer"],
    },
    {
      slug: "getting-started-with-fpv",
      title: "Getting Started With FPV: A Realistic Roadmap",
      excerpt:
        "Start FPV with 20 hours in a free simulator using a real controller, then fly a $95 micro whoop indoors before spending on a full kit. This order costs the least, teaches the most, and tells you within a month whether the hobby is for you.",
      body: `## The short answer

The proven path into FPV: **simulator first, micro whoop second, full-size quad third.** Total cost to find out if you love it: about $95 for a whoop (plus a controller if you do not buy a kit). Skipping steps is the expensive route, not the fast one.

## Step 1: Simulator (weeks 1-3)

FPV quads in acro mode do not self-level — that is what makes them capable of the flying you have seen in videos, and what makes the first hours humbling. A simulator turns those crashes into keystrokes. Use any mainstream FPV sim with a real controller; the hall-sensor controller in our Volt starter kit plugs straight into a PC over USB-C. Twenty hours of sim is the consensus threshold before real-world acro.

## Step 2: Micro whoop (month 1-2)

The Volt Micro Whoop weighs 25 g and bounces off walls without damage. Indoors, year-round, no weather excuses. Six included batteries give continuous practice sessions, and the analog video link pairs with budget goggles like the Volt Vision. Every skill transfers directly to bigger quads.

## Step 3: A real quad outdoors (month 2+)

The Volt FPV starter kit's 3.5-inch quad is the sensible first outdoor machine: powerful enough for real freestyle, small enough that crashes are usually repairable with a prop swap. Digital video at 28 ms latency is a genuine upgrade over analog for spatial awareness in trees and gaps.

## Honest cost expectations

- Crashing is part of FPV at every skill level; budget for props (consumable), the odd arm, and eventually motors.
- Batteries are the recurring cost: LiPos survive roughly 150-300 cycles when stored properly at storage voltage.
- The hobby rewards people who enjoy building and tuning. If that sounds like a chore, camera drones may fit you better — no judgment, different hobby.

## Rules still apply

FPV flying through goggles legally requires a spotter maintaining line of sight in most countries, and the same weight/zone rules as camera drones. Check before you rip.`,
      seoTitle: "Getting Started With FPV Drones: Simulator to First Quad",
      seoDescription:
        "A realistic FPV roadmap: 20 sim hours, a $95 micro whoop, then a full kit. Honest cost expectations, crash budgeting and the rules that apply.",
      relatedProductSlugs: ["volt-micro-whoop", "volt-fpv-starter-kit", "volt-vision-goggles"],
    },
  ],
  comparison: {
    slug: "camera-drone-comparison",
    title: "Skyforge Camera Drones Compared: Lite 2 vs S1 Mini vs X8 Pro",
    excerpt:
      "Three honest tiers: the Lite 2 for learning cheaply, the S1 Mini for the best footage-per-dollar under 250 g, the X8 Pro when image quality has concrete value.",
    body: "These are the three camera platforms we stock, and they map cleanly to three kinds of pilots. The Lite 2 exists to make your first hundred flights cheap and safe. The S1 Mini is the one most people should buy: a real gimbal and RAW stills below the 250-gram regulatory line. The X8 Pro earns its price only when footage quality converts into something concrete — paid work, serious projects, low-light shoots.\n\nThe table below shows the differences that actually change outcomes. Everything else — colorful marketing names for flight modes, app filters — is the same drone-shaped noise on every spec sheet in the industry.",
    seoTitle: "Camera Drone Comparison: Aero Lite 2 vs S1 Mini vs X8 Pro",
    seoDescription:
      "Side-by-side comparison of our three camera drones: weight class, gimbal, sensor, flight time and price — with honest guidance on who needs which.",
    productSlugs: ["aero-lite-2", "aero-s1-mini-4k", "aero-x8-pro"],
  },
  homepageFaq: [
    {
      question: "Where do orders ship from?",
      answer:
        "Directly from our partner suppliers' warehouses in Asia and the EU — we do not hold local stock, and we say so. Every product page shows the realistic delivery window for that item, typically 6-14 business days with tracking.",
    },
    {
      question: "Do I need to register my drone?",
      answer:
        "It depends on weight and your country. Sub-250 g models like the Aero S1 Mini face lighter rules in many regions, but requirements change — always check your national aviation authority before flying.",
    },
    {
      question: "What if my drone arrives damaged?",
      answer:
        "Email support@dronestore.example within 14 days with photos and we replace or refund it at our cost. You never deal with the supplier directly — we are your contract partner.",
    },
    {
      question: "Why don't you show customer star ratings?",
      answer:
        "Because we have not collected enough verified reviews yet, and we refuse to fake them. We show measured specs, honest pros and cons, and clear return rights instead.",
    },
    {
      question: "Can I return a drone I have flown?",
      answer:
        "Unflown drones return free within 30 days. Once flown, returns are accepted for defects under warranty; we cannot resell a crashed drone as new and will not pretend otherwise.",
    },
  ],
};

export const dronesPolicies = {
  privacyPolicy: defaultPrivacyPolicy(info),
  termsOfSale: defaultTermsOfSale(info),
};
