import { digestCatalogValue } from "./canonical";
import {
  COLLECTION_V2,
  EVIDENCE_V2,
  MONEY_V2,
  PRODUCT_REVISION_V2,
  REFERENCE_FIXTURE_V2,
  SUPPLIER_OBSERVATION_V2,
  SUPPLIER_OFFER_V2,
  TAXONOMY_V2,
  CatalogReferenceFixtureV2Schema,
  type AttributeDefinitionV2,
  type AttributeValueV2,
  type AvailabilityV2,
  type CatalogReferenceFixtureV2,
  type CollectionMembershipV2,
  type EvidenceV2,
  type MediaAssetV2,
  type MoneyV2,
  type ProductRevisionV2,
  type SupplierObservationV2,
  type SupplierOfferV2,
  type VariantV2,
} from "./contracts";

const FIXTURE_TIME = "2026-01-15T12:00:00.000Z";

function money(amountMinor: number, currency = "NOK"): MoneyV2 {
  return { version: MONEY_V2, currency, amountMinor };
}

function knownPrice(amountMinor: number, currency = "NOK") {
  return { state: "KNOWN" as const, money: money(amountMinor, currency) };
}

function fixtureEvidence(
  fixtureId: string,
  productId: string
): EvidenceV2 {
  return {
    version: EVIDENCE_V2,
    evidenceId: `evidence:${fixtureId}:${productId.split(":").at(-1)}`,
    kind: "MANUAL_ASSERTION",
    state: "VERIFIED",
    subjectType: "PRODUCT",
    subjectRef: productId,
    recordedAt: FIXTURE_TIME,
    sourceRef: `fixture:${fixtureId}`,
    contentDigest: digestCatalogValue({ fixtureId, productId, synthetic: true }),
    notes: ["Synthetic reference data; not supplier or production evidence"],
  };
}

function primaryMedia(
  fixtureId: string,
  productId: string,
  evidenceId: string,
  title: string
): MediaAssetV2 {
  const slug = productId.split(":").at(-1) ?? "product";
  return {
    mediaId: `media:${fixtureId}:${slug}:primary`,
    kind: "IMAGE",
    role: "PRIMARY",
    publicationState: "PUBLIC_READY",
    rights: {
      state: "VERIFIED",
      sourceKind: "SYNTHETIC",
      sourceUrl: null,
    },
    publicUrl: `https://assets.example.invalid/catalog-v2/${fixtureId}/${slug}/primary.webp`,
    mimeType: "image/webp",
    width: 1254,
    height: 1254,
    altText: title,
    focalPoint: { x: 0.5, y: 0.48 },
    variantIds: [],
    evidenceIds: [evidenceId],
    position: 0,
  };
}

function supplierPair(input: {
  fixtureId: string;
  productId: string;
  variantId?: string;
  availability: AvailabilityV2;
  quantity?: number | null;
  costMinor: number;
}): { offer: SupplierOfferV2; observation: SupplierObservationV2 } {
  const subject = input.variantId ?? input.productId;
  const suffix = subject.split(":").slice(-2).join("-") || "item";
  const offerId = `offer:${input.fixtureId}:${suffix}`;
  const observationId = `observation:${input.fixtureId}:${suffix}:1`;
  const evidenceId = `evidence:${input.fixtureId}:${input.productId.split(":").at(-1)}`;
  const unknown = input.availability === "UNKNOWN";
  return {
    offer: {
      version: SUPPLIER_OFFER_V2,
      offerId,
      productId: input.productId,
      variantId: input.variantId ?? null,
      supplierAccountRef: `supplier-account:${input.fixtureId}:synthetic`,
      sourceOfferRef: `source-offer:${input.fixtureId}:${suffix}`,
      state: unknown ? "UNKNOWN" : "ACTIVE",
      observedCurrency: "NOK",
      latestObservationId: observationId,
      createdAt: FIXTURE_TIME,
      evidenceIds: [evidenceId],
    },
    observation: {
      contractVersion: SUPPLIER_OBSERVATION_V2,
      observationId,
      offerId,
      observedAt: FIXTURE_TIME,
      outcome: unknown ? "UNKNOWN" : "OBSERVED",
      inventory: unknown
        ? { state: "UNKNOWN", availability: "UNKNOWN", quantity: null }
        : {
            state: "KNOWN",
            availability: input.availability as Exclude<
              AvailabilityV2,
              "UNKNOWN"
            >,
            quantity:
              input.availability === "OUT_OF_STOCK"
                ? 0
                : (input.quantity ?? null),
          },
      unitCost: unknown
        ? { state: "UNKNOWN", money: null }
        : { state: "KNOWN", money: money(input.costMinor) },
      shipping: unknown
        ? { state: "UNKNOWN", minDays: null, maxDays: null, cost: null }
        : {
            state: "KNOWN",
            minDays: 3,
            maxDays: 7,
            cost: money(7900),
          },
      sourcePayloadDigest: digestCatalogValue({
        fixtureId: input.fixtureId,
        subject,
        availability: input.availability,
        quantity: input.quantity ?? null,
        costMinor: unknown ? null : input.costMinor,
      }),
      evidenceIds: [evidenceId],
      reasonCodes: unknown ? ["SYNTHETIC_SOURCE_UNKNOWN"] : [],
    },
  };
}

const droneAttributeDefinitions: AttributeDefinitionV2[] = [
  {
    attributeDefinitionId: "attribute:drone:flight-time-min",
    key: "flight-time",
    label: "Flight time",
    dataType: "INTEGER",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: "min",
    allowedValues: [],
    position: 0,
  },
  {
    attributeDefinitionId: "attribute:drone:control-range-m",
    key: "control-range",
    label: "Control range",
    dataType: "INTEGER",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: "m",
    allowedValues: [],
    position: 1,
  },
  {
    attributeDefinitionId: "attribute:drone:camera-resolution",
    key: "camera-resolution",
    label: "Camera resolution",
    dataType: "ENUM",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: null,
    allowedValues: [
      { code: "no-camera", label: "No camera" },
      { code: "4k", label: "4K" },
      { code: "6k", label: "6K" },
      { code: "8k", label: "8K" },
    ],
    position: 2,
  },
  {
    attributeDefinitionId: "attribute:drone:takeoff-weight-g",
    key: "takeoff-weight",
    label: "Takeoff weight",
    dataType: "INTEGER",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: "g",
    allowedValues: [],
    position: 3,
  },
  {
    attributeDefinitionId: "attribute:drone:obstacle-avoidance",
    key: "obstacle-avoidance",
    label: "Obstacle avoidance",
    dataType: "BOOLEAN",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: null,
    allowedValues: [],
    position: 4,
  },
  {
    attributeDefinitionId: "attribute:drone:wind-level",
    key: "wind-resistance-level",
    label: "Wind resistance level",
    dataType: "INTEGER",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: null,
    allowedValues: [],
    position: 5,
  },
  {
    attributeDefinitionId: "attribute:drone:skill-level",
    key: "skill-level",
    label: "Skill level",
    dataType: "ENUM",
    cardinality: "SINGLE",
    scope: "PRODUCT",
    required: true,
    variantAxis: false,
    storefrontVisible: true,
    facetable: true,
    comparable: true,
    unitCode: null,
    allowedValues: [
      { code: "beginner", label: "Beginner" },
      { code: "intermediate", label: "Intermediate" },
      { code: "advanced", label: "Advanced" },
    ],
    position: 6,
  },
];

interface DroneFixtureRow {
  slug: string;
  title: string;
  taxonomyNodeId: string;
  collectionIds: string[];
  priceMinor: number;
  availability: AvailabilityV2;
  flightTime: number;
  range: number;
  camera: "no-camera" | "4k" | "6k" | "8k";
  weight: number;
  obstacleAvoidance: boolean;
  windLevel: number;
  skill: "beginner" | "intermediate" | "advanced";
}

const droneRows: DroneFixtureRow[] = [
  { slug: "scout-mini", title: "Scout Mini", taxonomyNodeId: "taxonomy:drone:mini", collectionIds: ["collection:drone:beginner"], priceMinor: 249900, availability: "IN_STOCK", flightTime: 24, range: 3000, camera: "4k", weight: 249, obstacleAvoidance: true, windLevel: 4, skill: "beginner" },
  { slug: "vista-4k", title: "Vista 4K", taxonomyNodeId: "taxonomy:drone:camera", collectionIds: ["collection:drone:aerial-photo"], priceMinor: 429900, availability: "IN_STOCK", flightTime: 31, range: 6000, camera: "4k", weight: 520, obstacleAvoidance: true, windLevel: 5, skill: "intermediate" },
  { slug: "trail-mapper", title: "Trail Mapper", taxonomyNodeId: "taxonomy:drone:camera", collectionIds: ["collection:drone:long-range"], priceMinor: 579900, availability: "LOW_STOCK", flightTime: 38, range: 10000, camera: "6k", weight: 690, obstacleAvoidance: true, windLevel: 6, skill: "intermediate" },
  { slug: "aero-fold", title: "Aero Fold", taxonomyNodeId: "taxonomy:drone:mini", collectionIds: ["collection:drone:beginner", "collection:drone:aerial-photo"], priceMinor: 329900, availability: "IN_STOCK", flightTime: 28, range: 5000, camera: "4k", weight: 249, obstacleAvoidance: false, windLevel: 4, skill: "beginner" },
  { slug: "cinema-pro", title: "Cinema Pro", taxonomyNodeId: "taxonomy:drone:camera", collectionIds: ["collection:drone:aerial-photo"], priceMinor: 1099900, availability: "LOW_STOCK", flightTime: 42, range: 12000, camera: "8k", weight: 980, obstacleAvoidance: true, windLevel: 7, skill: "advanced" },
  { slug: "survey-long-range", title: "Survey Long Range", taxonomyNodeId: "taxonomy:drone:camera", collectionIds: ["collection:drone:long-range"], priceMinor: 899900, availability: "IN_STOCK", flightTime: 47, range: 15000, camera: "6k", weight: 1100, obstacleAvoidance: true, windLevel: 7, skill: "advanced" },
  { slug: "indoor-guard", title: "Indoor Guard", taxonomyNodeId: "taxonomy:drone:mini", collectionIds: ["collection:drone:beginner"], priceMinor: 189900, availability: "IN_STOCK", flightTime: 18, range: 120, camera: "no-camera", weight: 180, obstacleAvoidance: true, windLevel: 1, skill: "beginner" },
  { slug: "night-explorer", title: "Night Explorer", taxonomyNodeId: "taxonomy:drone:camera", collectionIds: ["collection:drone:aerial-photo"], priceMinor: 699900, availability: "UNKNOWN", flightTime: 36, range: 8000, camera: "6k", weight: 760, obstacleAvoidance: true, windLevel: 6, skill: "advanced" },
  { slug: "wind-master", title: "Wind Master", taxonomyNodeId: "taxonomy:drone:camera", collectionIds: ["collection:drone:long-range"], priceMinor: 749900, availability: "IN_STOCK", flightTime: 40, range: 11000, camera: "4k", weight: 850, obstacleAvoidance: true, windLevel: 8, skill: "advanced" },
  { slug: "creator-fpv", title: "Creator FPV", taxonomyNodeId: "taxonomy:drone:fpv", collectionIds: ["collection:drone:aerial-photo"], priceMinor: 639900, availability: "UNKNOWN", flightTime: 22, range: 9000, camera: "4k", weight: 640, obstacleAvoidance: false, windLevel: 6, skill: "advanced" },
];

function droneAttributeValues(row: DroneFixtureRow): AttributeValueV2[] {
  return [
    { attributeDefinitionId: "attribute:drone:flight-time-min", dataType: "INTEGER", values: [row.flightTime] },
    { attributeDefinitionId: "attribute:drone:control-range-m", dataType: "INTEGER", values: [row.range] },
    { attributeDefinitionId: "attribute:drone:camera-resolution", dataType: "ENUM", values: [row.camera] },
    { attributeDefinitionId: "attribute:drone:takeoff-weight-g", dataType: "INTEGER", values: [row.weight] },
    { attributeDefinitionId: "attribute:drone:obstacle-avoidance", dataType: "BOOLEAN", values: [row.obstacleAvoidance] },
    { attributeDefinitionId: "attribute:drone:wind-level", dataType: "INTEGER", values: [row.windLevel] },
    { attributeDefinitionId: "attribute:drone:skill-level", dataType: "ENUM", values: [row.skill] },
  ];
}

function droneRevision(row: DroneFixtureRow, index: number): ProductRevisionV2 {
  const productId = `product:drone:${row.slug}`;
  const evidence = fixtureEvidence("drones", productId);
  return {
    contractVersion: PRODUCT_REVISION_V2,
    productId,
    revisionId: `revision:drone:${row.slug}:1`,
    revisionNumber: 1,
    revisionState: "PUBLISHED",
    createdAt: FIXTURE_TIME,
    slug: row.slug,
    taxonomyNodeIds: [row.taxonomyNodeId],
    title: row.title,
    subtitle: `${row.flightTime}-minute synthetic reference drone`,
    description: `${row.title} is synthetic catalog data for validating specification-heavy product modeling. It is not a real offer.`,
    seoTitle: `${row.title} specifications`,
    seoDescription: `Compare the synthetic ${row.title} reference drone by flight time, range, camera, weight, obstacle avoidance, and wind resistance.`,
    brand: "Reference Flight Lab",
    price:
      row.slug === "night-explorer"
        ? { state: "UNKNOWN", money: null }
        : knownPrice(row.priceMinor),
    compareAtPrice: null,
    availability: row.availability,
    attributeDefinitions: droneAttributeDefinitions,
    attributeValues: droneAttributeValues(row),
    variants: [],
    purchaseOptions: [],
    media: [primaryMedia("drones", productId, evidence.evidenceId, row.title)],
    collectionMemberships: row.collectionIds.map((collectionId, position) => ({
      collectionId,
      position: index * 10 + position,
      evidenceIds: [evidence.evidenceId],
    })),
    evidence: [evidence],
    reasonCodes: ["SYNTHETIC_REFERENCE_DATA"],
  };
}

const droneProductRevisions = droneRows.map(droneRevision);
const droneSupplierPairs = droneRows.map((row) =>
  supplierPair({
    fixtureId: "drones",
    productId: `product:drone:${row.slug}`,
    availability: row.availability,
    quantity: row.availability === "LOW_STOCK" ? 3 : 25,
    costMinor: Math.round(row.priceMinor * 0.58),
  })
);

export const droneCatalogFixtureV2: CatalogReferenceFixtureV2 =
  CatalogReferenceFixtureV2Schema.parse({
    version: REFERENCE_FIXTURE_V2,
    fixtureId: "reference:drones",
    description:
      "Ten specification-heavy synthetic drones spanning mini, camera, FPV, preorder, and unknown availability states.",
    generatedAt: FIXTURE_TIME,
    taxonomy: {
      version: TAXONOMY_V2,
      taxonomyId: "taxonomy:drones",
      nodes: [
        { taxonomyNodeId: "taxonomy:drone:root", parentId: null, slug: "drones", name: "Drones", description: null, path: ["drones"], depth: 0, position: 0 },
        { taxonomyNodeId: "taxonomy:drone:camera", parentId: "taxonomy:drone:root", slug: "camera-drones", name: "Camera drones", description: null, path: ["drones", "camera-drones"], depth: 1, position: 0 },
        { taxonomyNodeId: "taxonomy:drone:mini", parentId: "taxonomy:drone:root", slug: "mini-drones", name: "Mini drones", description: null, path: ["drones", "mini-drones"], depth: 1, position: 1 },
        { taxonomyNodeId: "taxonomy:drone:fpv", parentId: "taxonomy:drone:root", slug: "fpv-drones", name: "FPV drones", description: null, path: ["drones", "fpv-drones"], depth: 1, position: 2 },
      ],
    },
    collections: [
      { version: COLLECTION_V2, collectionId: "collection:drone:beginner", slug: "beginner-friendly", title: "Beginner friendly", description: null, kind: "MANUAL", publicationState: "PUBLIC", position: 0 },
      { version: COLLECTION_V2, collectionId: "collection:drone:aerial-photo", slug: "aerial-photography", title: "Aerial photography", description: null, kind: "MANUAL", publicationState: "PUBLIC", position: 1 },
      { version: COLLECTION_V2, collectionId: "collection:drone:long-range", slug: "long-range", title: "Long range", description: null, kind: "RULE_BASED", publicationState: "PUBLIC", position: 2 },
    ],
    productRevisions: droneProductRevisions,
    supplierOffers: droneSupplierPairs.map((pair) => pair.offer),
    supplierObservations: droneSupplierPairs.map((pair) => pair.observation),
  });

interface ApparelVariantRow {
  size: string;
  color: string;
  availability: AvailabilityV2;
}

const APPAREL_ATTRIBUTE_IDS = {
  material: "attribute:apparel:material",
  waterproof: "attribute:apparel:waterproof",
  size: "attribute:apparel:size",
  color: "attribute:apparel:color",
} as const;

const APPAREL_SIZES = [
  { code: "38", label: "38" },
  { code: "40", label: "40" },
  { code: "42", label: "42" },
  { code: "s", label: "S" },
  { code: "m", label: "M" },
  { code: "l", label: "L" },
] as const;

const APPAREL_COLORS = [
  { code: "black", label: "Black" },
  { code: "berry", label: "Berry" },
  { code: "coral", label: "Coral" },
  { code: "graphite", label: "Graphite" },
  { code: "moss", label: "Moss" },
  { code: "navy", label: "Navy" },
  { code: "sand", label: "Sand" },
  { code: "slate", label: "Slate" },
] as const;

function apparelRevision(input: {
  slug: string;
  title: string;
  taxonomyNodeId: string;
  priceMinor: number;
  sizes: Array<{ code: string; label: string }>;
  colors: Array<{ code: string; label: string }>;
  variants: ApparelVariantRow[];
  material: string;
  waterproof: boolean;
  collectionIds: string[];
}): ProductRevisionV2 {
  const productId = `product:apparel:${input.slug}`;
  const evidence = fixtureEvidence("apparel", productId);
  const sizeDefinitionId = APPAREL_ATTRIBUTE_IDS.size;
  const colorDefinitionId = APPAREL_ATTRIBUTE_IDS.color;
  const materialDefinitionId = APPAREL_ATTRIBUTE_IDS.material;
  const waterproofDefinitionId = APPAREL_ATTRIBUTE_IDS.waterproof;
  const definitions: AttributeDefinitionV2[] = [
    { attributeDefinitionId: materialDefinitionId, key: "material", label: "Material", dataType: "TEXT", cardinality: "SINGLE", scope: "PRODUCT", required: true, variantAxis: false, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [], position: 0 },
    { attributeDefinitionId: waterproofDefinitionId, key: "waterproof", label: "Waterproof", dataType: "BOOLEAN", cardinality: "SINGLE", scope: "PRODUCT", required: true, variantAxis: false, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [], position: 1 },
    { attributeDefinitionId: sizeDefinitionId, key: "size", label: "Size", dataType: "ENUM", cardinality: "SINGLE", scope: "VARIANT", required: true, variantAxis: true, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [...APPAREL_SIZES], position: 2 },
    { attributeDefinitionId: colorDefinitionId, key: "color", label: "Color", dataType: "ENUM", cardinality: "SINGLE", scope: "VARIANT", required: true, variantAxis: true, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [...APPAREL_COLORS], position: 3 },
  ];
  const variantMedia: MediaAssetV2[] = [];
  const variants: VariantV2[] = input.variants.map((row, index) => {
    const variantId = `variant:apparel:${input.slug}:${row.size}-${row.color}`;
    const mediaId = `media:apparel:${input.slug}:${row.color}-${row.size}`;
    variantMedia.push({
      mediaId,
      kind: "IMAGE",
      role: "VARIANT",
      publicationState: "PUBLIC_READY",
      rights: {
        state: "VERIFIED",
        sourceKind: "SYNTHETIC",
        sourceUrl: null,
      },
      publicUrl: `https://assets.example.invalid/catalog-v2/apparel/${input.slug}/${row.color}-${row.size}.webp`,
      mimeType: "image/webp",
      width: 1254,
      height: 1254,
      altText: `${input.title}, ${row.color}, size ${row.size}`,
      focalPoint: { x: 0.5, y: 0.55 },
      variantIds: [variantId],
      evidenceIds: [evidence.evidenceId],
      position: index + 1,
    });
    return {
      variantId,
      label: `${row.color} / ${row.size}`,
      attributeValues: [
        { attributeDefinitionId: sizeDefinitionId, dataType: "ENUM", values: [row.size] },
        { attributeDefinitionId: colorDefinitionId, dataType: "ENUM", values: [row.color] },
      ],
      price: null,
      compareAtPrice: null,
      availability: row.availability,
      mediaIds: [mediaId],
      isDefault: index === 0,
      position: index,
    };
  });
  return {
    contractVersion: PRODUCT_REVISION_V2,
    productId,
    revisionId: `revision:apparel:${input.slug}:1`,
    revisionNumber: 1,
    revisionState: "PUBLISHED",
    createdAt: FIXTURE_TIME,
    slug: input.slug,
    taxonomyNodeIds: [input.taxonomyNodeId],
    title: input.title,
    subtitle: "Synthetic size, color, and variant-media reference",
    description: `${input.title} is synthetic catalog data used to exercise apparel variation and media relationships.`,
    seoTitle: `${input.title} sizes and colors`,
    seoDescription: `Explore the synthetic ${input.title} reference across size, color, material, availability, and variant-specific imagery.`,
    brand: "Reference Outfitters",
    price: knownPrice(input.priceMinor),
    compareAtPrice: null,
    availability: "IN_STOCK",
    attributeDefinitions: definitions,
    attributeValues: [
      { attributeDefinitionId: materialDefinitionId, dataType: "TEXT", values: [input.material] },
      { attributeDefinitionId: waterproofDefinitionId, dataType: "BOOLEAN", values: [input.waterproof] },
    ],
    variants,
    purchaseOptions: [],
    media: [primaryMedia("apparel", productId, evidence.evidenceId, input.title), ...variantMedia],
    collectionMemberships: input.collectionIds.map((collectionId, position): CollectionMembershipV2 => ({ collectionId, position, evidenceIds: [evidence.evidenceId] })),
    evidence: [evidence],
    reasonCodes: ["SYNTHETIC_REFERENCE_DATA"],
  };
}

const apparelProductRevisions = [
  apparelRevision({
    slug: "ridge-trail-shoe",
    title: "Ridge Trail Shoe",
    taxonomyNodeId: "taxonomy:apparel:trail-shoes",
    priceMinor: 159900,
    sizes: [{ code: "38", label: "38" }, { code: "40", label: "40" }, { code: "42", label: "42" }],
    colors: [{ code: "navy", label: "Navy" }, { code: "sand", label: "Sand" }],
    variants: [
      { size: "38", color: "navy", availability: "IN_STOCK" },
      { size: "40", color: "navy", availability: "IN_STOCK" },
      { size: "42", color: "navy", availability: "LOW_STOCK" },
      { size: "38", color: "sand", availability: "OUT_OF_STOCK" },
      { size: "40", color: "sand", availability: "IN_STOCK" },
      { size: "42", color: "sand", availability: "UNKNOWN" },
    ],
    material: "Recycled mesh and rubber",
    waterproof: false,
    collectionIds: ["collection:apparel:trail", "collection:apparel:new"],
  }),
  apparelRevision({
    slug: "harbor-shell-jacket",
    title: "Harbor Shell Jacket",
    taxonomyNodeId: "taxonomy:apparel:shell-jackets",
    priceMinor: 219900,
    sizes: [{ code: "s", label: "S" }, { code: "m", label: "M" }, { code: "l", label: "L" }],
    colors: [{ code: "moss", label: "Moss" }, { code: "slate", label: "Slate" }],
    variants: [
      { size: "s", color: "moss", availability: "IN_STOCK" },
      { size: "m", color: "moss", availability: "IN_STOCK" },
      { size: "l", color: "moss", availability: "LOW_STOCK" },
      { size: "s", color: "slate", availability: "IN_STOCK" },
      { size: "m", color: "slate", availability: "IN_STOCK" },
      { size: "l", color: "slate", availability: "OUT_OF_STOCK" },
    ],
    material: "Three-layer recycled nylon",
    waterproof: true,
    collectionIds: ["collection:apparel:trail"],
  }),
  apparelRevision({
    slug: "meridian-base-layer",
    title: "Meridian Base Layer",
    taxonomyNodeId: "taxonomy:apparel:base-layers",
    priceMinor: 89900,
    sizes: [{ code: "s", label: "S" }, { code: "m", label: "M" }, { code: "l", label: "L" }],
    colors: [{ code: "berry", label: "Berry" }, { code: "graphite", label: "Graphite" }],
    variants: [
      { size: "s", color: "berry", availability: "IN_STOCK" },
      { size: "m", color: "berry", availability: "IN_STOCK" },
      { size: "l", color: "berry", availability: "LOW_STOCK" },
      { size: "s", color: "graphite", availability: "IN_STOCK" },
      { size: "m", color: "graphite", availability: "IN_STOCK" },
      { size: "l", color: "graphite", availability: "UNKNOWN" },
    ],
    material: "Merino wool blend",
    waterproof: false,
    collectionIds: ["collection:apparel:trail", "collection:apparel:new"],
  }),
  apparelRevision({
    slug: "coast-walk-sandal",
    title: "Coast Walk Sandal",
    taxonomyNodeId: "taxonomy:apparel:sandals",
    priceMinor: 109900,
    sizes: [{ code: "38", label: "38" }, { code: "40", label: "40" }, { code: "42", label: "42" }],
    colors: [{ code: "coral", label: "Coral" }, { code: "black", label: "Black" }],
    variants: [
      { size: "38", color: "coral", availability: "IN_STOCK" },
      { size: "40", color: "coral", availability: "LOW_STOCK" },
      { size: "42", color: "coral", availability: "OUT_OF_STOCK" },
      { size: "38", color: "black", availability: "IN_STOCK" },
      { size: "40", color: "black", availability: "IN_STOCK" },
      { size: "42", color: "black", availability: "LOW_STOCK" },
    ],
    material: "Synthetic webbing and EVA",
    waterproof: true,
    collectionIds: ["collection:apparel:new"],
  }),
];
const apparelSupplierPairs = apparelProductRevisions.map((revision, index) =>
  supplierPair({
    fixtureId: "apparel",
    productId: revision.productId,
    availability: index === 0 ? "IN_STOCK" : "LOW_STOCK",
    quantity: index === 0 ? 40 : 7,
    costMinor: index === 0 ? 76000 : 112000,
  })
);

export const apparelCatalogFixtureV2: CatalogReferenceFixtureV2 =
  CatalogReferenceFixtureV2Schema.parse({
    version: REFERENCE_FIXTURE_V2,
    fixtureId: "reference:apparel",
    description:
      "Synthetic shoes and outerwear with size/color axes and normalized variant-specific media.",
    generatedAt: FIXTURE_TIME,
    taxonomy: {
      version: TAXONOMY_V2,
      taxonomyId: "taxonomy:apparel",
      nodes: [
        { taxonomyNodeId: "taxonomy:apparel:root", parentId: null, slug: "apparel", name: "Apparel", description: null, path: ["apparel"], depth: 0, position: 0 },
        { taxonomyNodeId: "taxonomy:apparel:footwear", parentId: "taxonomy:apparel:root", slug: "footwear", name: "Footwear", description: null, path: ["apparel", "footwear"], depth: 1, position: 0 },
        { taxonomyNodeId: "taxonomy:apparel:trail-shoes", parentId: "taxonomy:apparel:footwear", slug: "trail-shoes", name: "Trail shoes", description: null, path: ["apparel", "footwear", "trail-shoes"], depth: 2, position: 0 },
        { taxonomyNodeId: "taxonomy:apparel:sandals", parentId: "taxonomy:apparel:footwear", slug: "sandals", name: "Sandals", description: null, path: ["apparel", "footwear", "sandals"], depth: 2, position: 1 },
        { taxonomyNodeId: "taxonomy:apparel:outerwear", parentId: "taxonomy:apparel:root", slug: "outerwear", name: "Outerwear", description: null, path: ["apparel", "outerwear"], depth: 1, position: 1 },
        { taxonomyNodeId: "taxonomy:apparel:shell-jackets", parentId: "taxonomy:apparel:outerwear", slug: "shell-jackets", name: "Shell jackets", description: null, path: ["apparel", "outerwear", "shell-jackets"], depth: 2, position: 0 },
        { taxonomyNodeId: "taxonomy:apparel:base-layers", parentId: "taxonomy:apparel:root", slug: "base-layers", name: "Base layers", description: null, path: ["apparel", "base-layers"], depth: 1, position: 2 },
      ],
    },
    collections: [
      { version: COLLECTION_V2, collectionId: "collection:apparel:trail", slug: "trail-essentials", title: "Trail essentials", description: null, kind: "MANUAL", publicationState: "PUBLIC", position: 0 },
      { version: COLLECTION_V2, collectionId: "collection:apparel:new", slug: "new-arrivals", title: "New arrivals", description: null, kind: "RULE_BASED", publicationState: "PUBLIC", position: 1 },
    ],
    productRevisions: apparelProductRevisions,
    supplierOffers: apparelSupplierPairs.map((pair) => pair.offer),
    supplierObservations: apparelSupplierPairs.map((pair) => pair.observation),
  });

interface ConsumableFixtureRow {
  slug: string;
  title: string;
  roast: "light" | "medium" | "dark";
  smallPriceMinor: number;
  largePriceMinor: number;
  productAvailability: AvailabilityV2;
  smallAvailability: AvailabilityV2;
  largeAvailability: AvailabilityV2;
  bundleAvailability: AvailabilityV2;
  repeatIntervals: number[];
}

const CONSUMABLE_ATTRIBUTE_IDS = {
  roast: "attribute:consumable:roast-level",
  wholeBean: "attribute:consumable:whole-bean",
  packSize: "attribute:consumable:pack-size",
} as const;

function consumableRevision(row: ConsumableFixtureRow): ProductRevisionV2 {
  const productId = `product:consumable:${row.slug}`;
  const evidence = fixtureEvidence("consumables", productId);
  const roastDefinitionId = CONSUMABLE_ATTRIBUTE_IDS.roast;
  const beanDefinitionId = CONSUMABLE_ATTRIBUTE_IDS.wholeBean;
  const packDefinitionId = CONSUMABLE_ATTRIBUTE_IDS.packSize;
  const smallVariantId = `variant:consumable:${row.slug}:250g`;
  const largeVariantId = `variant:consumable:${row.slug}:1kg`;
  const bundleCompareAt = row.smallPriceMinor * 3;
  const bundlePrice = Math.round(bundleCompareAt * 0.9);
  return {
    contractVersion: PRODUCT_REVISION_V2,
    productId,
    revisionId: `revision:consumable:${row.slug}:1`,
    revisionNumber: 1,
    revisionState: "PUBLISHED",
    createdAt: FIXTURE_TIME,
    slug: row.slug,
    taxonomyNodeIds: ["taxonomy:consumable:coffee-beans"],
    title: row.title,
    subtitle: "Synthetic repeat-purchase and bundle reference",
    description:
      `${row.title} is synthetic whole-bean coffee used to validate bundles, repeat-purchase intervals, and explicit stock states.`,
    seoTitle: `${row.title} packs and repeat purchase`,
    seoDescription: `Explore synthetic ${row.title} single packs, bundles, stock status, and repeat-purchase intervals for catalog validation.`,
    brand: "Reference Roastery",
    price: knownPrice(row.smallPriceMinor),
    compareAtPrice: null,
    availability: row.productAvailability,
    attributeDefinitions: [
      { attributeDefinitionId: roastDefinitionId, key: "roast-level", label: "Roast level", dataType: "ENUM", cardinality: "SINGLE", scope: "PRODUCT", required: true, variantAxis: false, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [{ code: "light", label: "Light" }, { code: "medium", label: "Medium" }, { code: "dark", label: "Dark" }], position: 0 },
      { attributeDefinitionId: beanDefinitionId, key: "whole-bean", label: "Whole bean", dataType: "BOOLEAN", cardinality: "SINGLE", scope: "PRODUCT", required: true, variantAxis: false, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [], position: 1 },
      { attributeDefinitionId: packDefinitionId, key: "pack-size", label: "Pack size", dataType: "ENUM", cardinality: "SINGLE", scope: "VARIANT", required: true, variantAxis: true, storefrontVisible: true, facetable: true, comparable: true, unitCode: null, allowedValues: [{ code: "250g", label: "250 g" }, { code: "1kg", label: "1 kg" }], position: 2 },
    ],
    attributeValues: [
      { attributeDefinitionId: roastDefinitionId, dataType: "ENUM", values: [row.roast] },
      { attributeDefinitionId: beanDefinitionId, dataType: "BOOLEAN", values: [true] },
    ],
    variants: [
      { variantId: smallVariantId, label: "250 g", attributeValues: [{ attributeDefinitionId: packDefinitionId, dataType: "ENUM", values: ["250g"] }], price: knownPrice(row.smallPriceMinor), compareAtPrice: null, availability: row.smallAvailability, mediaIds: [], isDefault: true, position: 0 },
      { variantId: largeVariantId, label: "1 kg", attributeValues: [{ attributeDefinitionId: packDefinitionId, dataType: "ENUM", values: ["1kg"] }], price: knownPrice(row.largePriceMinor), compareAtPrice: null, availability: row.largeAvailability, mediaIds: [], isDefault: false, position: 1 },
    ],
    purchaseOptions: [
      { purchaseOptionId: `purchase:${row.slug}:single-250g`, kind: "SINGLE", label: "One 250 g bag", quantity: 1, variantId: smallVariantId, price: knownPrice(row.smallPriceMinor), compareAtPrice: null, availability: row.smallAvailability, repeatPurchase: { state: "ELIGIBLE", intervalDays: row.repeatIntervals }, position: 0 },
      { purchaseOptionId: `purchase:${row.slug}:bundle-3x250g`, kind: "BUNDLE", label: "Three 250 g bags", quantity: 3, variantId: smallVariantId, price: knownPrice(bundlePrice), compareAtPrice: money(bundleCompareAt), availability: row.bundleAvailability, repeatPurchase: { state: "ELIGIBLE", intervalDays: row.repeatIntervals }, position: 1 },
      { purchaseOptionId: `purchase:${row.slug}:single-1kg`, kind: "SINGLE", label: "One 1 kg bag", quantity: 1, variantId: largeVariantId, price: knownPrice(row.largePriceMinor), compareAtPrice: null, availability: row.largeAvailability, repeatPurchase: { state: "INELIGIBLE", intervalDays: [] }, position: 2 },
    ],
    media: [primaryMedia("consumables", productId, evidence.evidenceId, row.title)],
    collectionMemberships: [
      { collectionId: "collection:consumable:repeat", position: 0, evidenceIds: [evidence.evidenceId] },
      { collectionId: "collection:consumable:bundles", position: 0, evidenceIds: [evidence.evidenceId] },
    ],
    evidence: [evidence],
    reasonCodes: ["SYNTHETIC_REFERENCE_DATA"],
  };
}

const consumableRows: ConsumableFixtureRow[] = [
  { slug: "fjord-roast-beans", title: "Fjord Roast Coffee Beans", roast: "medium", smallPriceMinor: 15900, largePriceMinor: 49900, productAvailability: "IN_STOCK", smallAvailability: "IN_STOCK", largeAvailability: "OUT_OF_STOCK", bundleAvailability: "LOW_STOCK", repeatIntervals: [14, 30] },
  { slug: "morning-filter-blend", title: "Morning Filter Blend", roast: "light", smallPriceMinor: 16900, largePriceMinor: 52900, productAvailability: "IN_STOCK", smallAvailability: "IN_STOCK", largeAvailability: "IN_STOCK", bundleAvailability: "IN_STOCK", repeatIntervals: [14, 21, 30] },
  { slug: "night-decaf-beans", title: "Night Decaf Coffee Beans", roast: "dark", smallPriceMinor: 17900, largePriceMinor: 55900, productAvailability: "LOW_STOCK", smallAvailability: "LOW_STOCK", largeAvailability: "UNKNOWN", bundleAvailability: "LOW_STOCK", repeatIntervals: [30, 45] },
  { slug: "winter-reserve-beans", title: "Winter Reserve Coffee Beans", roast: "dark", smallPriceMinor: 19900, largePriceMinor: 62900, productAvailability: "OUT_OF_STOCK", smallAvailability: "OUT_OF_STOCK", largeAvailability: "OUT_OF_STOCK", bundleAvailability: "OUT_OF_STOCK", repeatIntervals: [30] },
];
const consumableProductRevisions = consumableRows.map(consumableRevision);
const consumableSupplierPairs = consumableProductRevisions.flatMap((revision) =>
  revision.variants.map((variant) =>
    supplierPair({
      fixtureId: "consumables",
      productId: revision.productId,
      variantId: variant.variantId,
      availability: variant.availability,
      quantity: variant.availability === "OUT_OF_STOCK" ? 0 : 60,
      costMinor: Math.round(
        (variant.price?.state === "KNOWN"
          ? variant.price.money.amountMinor
          : revision.price.state === "KNOWN"
            ? revision.price.money.amountMinor
            : 0) * 0.46
      ),
    })
  )
);

export const consumableCatalogFixtureV2: CatalogReferenceFixtureV2 =
  CatalogReferenceFixtureV2Schema.parse({
    version: REFERENCE_FIXTURE_V2,
    fixtureId: "reference:consumables",
    description:
      "Synthetic consumable with single and bundle purchase options, repeat-purchase intervals, and an out-of-stock pack variant.",
    generatedAt: FIXTURE_TIME,
    taxonomy: {
      version: TAXONOMY_V2,
      taxonomyId: "taxonomy:consumables",
      nodes: [
        { taxonomyNodeId: "taxonomy:consumable:root", parentId: null, slug: "consumables", name: "Consumables", description: null, path: ["consumables"], depth: 0, position: 0 },
        { taxonomyNodeId: "taxonomy:consumable:coffee", parentId: "taxonomy:consumable:root", slug: "coffee", name: "Coffee", description: null, path: ["consumables", "coffee"], depth: 1, position: 0 },
        { taxonomyNodeId: "taxonomy:consumable:coffee-beans", parentId: "taxonomy:consumable:coffee", slug: "coffee-beans", name: "Coffee beans", description: null, path: ["consumables", "coffee", "coffee-beans"], depth: 2, position: 0 },
      ],
    },
    collections: [
      { version: COLLECTION_V2, collectionId: "collection:consumable:repeat", slug: "repeat-purchase", title: "Repeat purchase", description: null, kind: "RULE_BASED", publicationState: "PUBLIC", position: 0 },
      { version: COLLECTION_V2, collectionId: "collection:consumable:bundles", slug: "bundles", title: "Bundles", description: null, kind: "MANUAL", publicationState: "PUBLIC", position: 1 },
    ],
    productRevisions: consumableProductRevisions,
    supplierOffers: consumableSupplierPairs.map((pair) => pair.offer),
    supplierObservations: consumableSupplierPairs.map((pair) => pair.observation),
  });

export const catalogReferenceFixturesV2 = [
  droneCatalogFixtureV2,
  apparelCatalogFixtureV2,
  consumableCatalogFixtureV2,
] as const;
