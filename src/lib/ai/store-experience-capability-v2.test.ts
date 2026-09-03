import assert from "node:assert/strict";
import test from "node:test";
import type { StoreExperienceCatalogProjectionV2 } from "@/lib/storefront-v2/catalog-context";
import type { StoreExperienceManifestV2 } from "@/lib/storefront-v2/manifest";
import {
  STORE_EXPERIENCE_PROMPT_VERSION,
  canonicalSha256V1,
  createStoreExperienceProposalRequestV1,
  runStoreExperienceProposalV1,
} from "./store-experience-capability-v2";

const catalog: StoreExperienceCatalogProjectionV2 = {
  version: "store-experience-catalog-projection.v2",
  projectionRef: "fixture.drone.v1",
  store: { name: "Aerial Atlas", niche: "camera drones" },
  categories: [
    {
      categoryId: "category.camera-drones",
      parentCategoryId: null,
      slug: "camera-drones",
      title: "Camera drones",
      description: "Compare flight-ready camera drones.",
      path: ["camera-drones"],
      depth: 0,
      position: 0,
    },
  ],
  collections: [],
  attributeDefinitions: [],
  products: [
    {
      version: "catalog-storefront-product.v2",
      productId: "product.drone-one",
      revisionId: "revision.drone-one.1",
      slug: "drone-one",
      title: "Drone One",
      subtitle: null,
      description: "A compact camera drone.",
      seoTitle: "Drone One | Aerial Atlas",
      seoDescription: "Compare Drone One using consistent product facts.",
      brand: null,
      taxonomyNodeIds: ["category.camera-drones"],
      collections: [],
      attributes: [],
      media: [
        {
          mediaId: "media.drone-one.primary",
          kind: "IMAGE",
          role: "PRIMARY",
          publicUrl: "https://cdn.example.test/drone-one.jpg",
          width: 1200,
          height: 1200,
          altText: "Drone One product preview",
          focalPoint: null,
          variantIds: [],
          position: 0,
        },
      ],
      variants: [],
      purchaseOptions: [],
      price: {
        state: "KNOWN",
        money: {
          version: "catalog-money.v2",
          amountMinor: 12900,
          currency: "NOK",
        },
      },
      compareAtPrice: null,
      availability: "IN_STOCK",
      purchasable: true,
    },
  ],
  verifiedClaims: ["secure-checkout", "clear-returns"],
};

const manifest: StoreExperienceManifestV2 = {
  version: "store-experience-manifest.v2",
  catalogProjectionRef: catalog.projectionRef,
  designTokens: {
    palette: {
      background: "#ffffff",
      surface: "#f1f5f9",
      text: "#0f172a",
      mutedText: "#475569",
      primary: "#075985",
      onPrimary: "#ffffff",
      border: "#cbd5e1",
    },
    typography: {
      headingFamily: "system-sans",
      bodyFamily: "system-sans",
      scale: "standard",
    },
    spacing: {
      density: "comfortable",
      sectionGap: "medium",
      contentWidth: "standard",
    },
    shape: { radius: "soft", cardStyle: "bordered", shadow: "soft" },
    imagery: { productFit: "contain", productRatio: "square" },
  },
  chrome: {
    header: {
      variant: "standard",
      brandLabel: "Aerial Atlas",
      navigation: [
        { id: "nav.drones", label: "Drones", href: "/c/camera-drones" },
      ],
      search: "field",
      cartSlot: "commerce.cart.v1",
    },
    footer: {
      variant: "columns",
      tagline: "Useful comparisons for careful flyers.",
      navigation: [],
      merchantIdentitySlot: "policy.merchant-identity.v1",
      policyLinksSlot: "policy.links.v1",
    },
  },
  pages: {
    home: {
      blocks: [
        {
          id: "home.hero",
          type: "hero",
          layout: "split",
          title: "See the view before take-off",
          body: "Compare camera drones using consistent product facts.",
          primaryAction: {
            label: "Explore drones",
            href: "/c/camera-drones",
            emphasis: "primary",
          },
        },
        {
          id: "home.products",
          type: "product-grid",
          title: "Camera drones",
          productRefs: ["product.drone-one"],
          columns: "three",
          productCardSlot: "commerce.product-card.v1",
        },
      ],
    },
    plp: {
      blocks: [
        {
          id: "plp.header",
          type: "category-header",
          alignment: "left",
          showDescription: true,
        },
        {
          id: "plp.filters",
          type: "filter-bar",
          source: "taxonomy-attributes",
          showResultCount: true,
        },
        {
          id: "plp.products",
          type: "product-grid",
          title: "All drones",
          columns: "three",
          productCardSlot: "commerce.product-card.v1",
        },
      ],
    },
    pdp: {
      blocks: [
        {
          id: "pdp.gallery",
          type: "product-gallery",
          gallerySlot: "commerce.product-gallery.v1",
          showThumbnails: true,
        },
        {
          id: "pdp.summary",
          type: "product-summary",
          showTaxonomyBreadcrumbs: true,
        },
        {
          id: "pdp.purchase",
          type: "purchase-panel",
          purchaseSlot: "commerce.purchase-panel.v1",
          showAvailability: true,
        },
      ],
    },
    content: {
      blocks: [
        {
          id: "content.header",
          type: "content-header",
          alignment: "left",
        },
        {
          id: "content.article",
          type: "article-body",
          contentSlot: "content.rich-text.v1",
        },
        {
          id: "content.policy",
          type: "policy-page",
          policySlot: "policy.page.v1",
        },
      ],
    },
  },
  protectedShells: {
    commerce: {
      locked: true,
      cart: "commerce.cart.v1",
      checkout: "commerce.checkout.v1",
      productCard: "commerce.product-card.v1",
      productGallery: "commerce.product-gallery.v1",
      purchasePanel: "commerce.purchase-panel.v1",
      newsletterSignup: "commerce.newsletter-signup.v1",
    },
    policy: {
      locked: true,
      merchantIdentity: "policy.merchant-identity.v1",
      links: "policy.links.v1",
      page: "policy.page.v1",
    },
  },
  features: {
    wishlist: false,
    compare: false,
    quiz: false,
    recommendations: false,
  },
};

function request() {
  return createStoreExperienceProposalRequestV1({
    tenantId: "tenant-1",
    storeId: "store-1",
    idempotencyKey: "experience-run-1",
    brief: {
      brandName: "Aerial Atlas",
      niche: "camera drones",
      audience: "First-time camera-drone buyers",
      positioning: "value",
      voice: "expert",
      objective: "compare",
    },
    catalog,
  });
}

test("canonical digest is stable across object key order", () => {
  assert.equal(
    canonicalSha256V1({ b: 2, a: { y: 2, x: 1 } }),
    canonicalSha256V1({ a: { x: 1, y: 2 }, b: 2 })
  );
});

test("proposal request refuses supplier fields outside the public catalog contract", () => {
  const unsafeCatalog = structuredClone(catalog) as unknown as Record<
    string,
    unknown
  >;
  (unsafeCatalog.products as Array<Record<string, unknown>>)[0]!.supplierOfferId =
    "supplier-secret";

  assert.throws(
    () =>
      createStoreExperienceProposalRequestV1({
        tenantId: "tenant-1",
        storeId: "store-1",
        idempotencyKey: "experience-run-unsafe",
        brief: {
          brandName: "Aerial Atlas",
          niche: "camera drones",
          audience: "First-time camera-drone buyers",
          positioning: "value",
          voice: "expert",
          objective: "compare",
        },
        catalog:
          unsafeCatalog as unknown as StoreExperienceCatalogProjectionV2,
      }),
    /unrecognized key/i
  );
});

test("records a validated manifest as proposal-only with provenance and integer cost", async () => {
  const result = await runStoreExperienceProposalV1({
    request: request(),
    adapter: {
      propose: async () => ({
        provider: "test-provider",
        model: "test-model",
        promptVersion: STORE_EXPERIENCE_PROMPT_VERSION,
        providerResponseId: "response-1",
        output: manifest,
        usage: { inputTokens: 120, outputTokens: 330, costMicroUsd: 1240 },
      }),
    },
  });

  assert.equal(result.status, "PROPOSED");
  assert.equal(result.disposition, "PROPOSAL_ONLY");
  assert.equal(result.outputDigest, canonicalSha256V1(manifest));
  assert.equal(result.usage.costMicroUsd, 1240);
  assert.equal(result.manifest?.protectedShells.commerce.locked, true);
});

test("a request mutated after digest creation is refused before provider access", async () => {
  const tampered = structuredClone(request());
  tampered.brief.positioning = "premium";
  let providerCalls = 0;

  await assert.rejects(
    runStoreExperienceProposalV1({
      request: tampered,
      adapter: {
        propose: async () => {
          providerCalls += 1;
          throw new Error("must not run");
        },
      },
    }),
    /request integrity check failed/i
  );
  assert.equal(providerCalls, 0);
});

test("malformed model output creates no partial manifest", async () => {
  const result = await runStoreExperienceProposalV1({
    request: request(),
    adapter: {
      propose: async () => ({
        provider: "test-provider",
        model: "test-model",
        promptVersion: STORE_EXPERIENCE_PROMPT_VERSION,
        providerResponseId: null,
        output: { version: "store-experience-manifest.v2", arbitraryHtml: "<script>" },
        usage: { inputTokens: null, outputTokens: null, costMicroUsd: null },
      }),
    },
  });

  assert.equal(result.status, "REJECTED");
  assert.equal(result.failureCode, "MALFORMED_OUTPUT");
  assert.equal(result.manifest, null);
  assert.equal(result.fallback, "DETERMINISTIC_DEFAULT_AVAILABLE");
});

test("malformed provider envelopes reject without escaping the capability boundary", async () => {
  const result = await runStoreExperienceProposalV1({
    request: request(),
    adapter: {
      async propose() {
        return null as never;
      },
    },
  });

  assert.equal(result.status, "REJECTED");
  assert.equal(result.failureCode, "MALFORMED_OUTPUT");
  assert.equal(result.manifest, null);
  assert.equal(result.provider, null);
  assert.equal(result.outputDigest, null);
});

test("prompt provenance mismatch is rejected", async () => {
  const result = await runStoreExperienceProposalV1({
    request: request(),
    adapter: {
      propose: async () => ({
        provider: "test-provider",
        model: "test-model",
        promptVersion: "unknown-prompt",
        providerResponseId: "response-2",
        output: manifest,
        usage: { inputTokens: 1, outputTokens: 1, costMicroUsd: 2 },
      }),
    },
  });

  assert.equal(result.status, "REJECTED");
  assert.equal(result.failureCode, "PROVENANCE_MISMATCH");
  assert.equal(result.manifest, null);
});

test("provider errors retain the deterministic fallback without a manifest", async () => {
  const result = await runStoreExperienceProposalV1({
    request: request(),
    adapter: {
      propose: async () => {
        throw new Error("provider unavailable");
      },
    },
  });

  assert.equal(result.status, "REJECTED");
  assert.equal(result.failureCode, "PROVIDER_FAILED");
  assert.equal(result.manifest, null);
  assert.equal(result.outputDigest, null);
});

test("an adapter that ignores AbortSignal is still bounded by the capability timeout", async () => {
  const startedAt = Date.now();
  const result = await runStoreExperienceProposalV1({
    request: request(),
    timeoutMs: 250,
    adapter: {
      propose: async () => new Promise(() => undefined),
    },
  });

  assert.equal(result.status, "INDETERMINATE");
  assert.equal(result.failureCode, "PROVIDER_TIMEOUT");
  assert.equal(result.manifest, null);
  assert.ok(Date.now() - startedAt < 2_000);
});
