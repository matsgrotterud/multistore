import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildReferenceStoreFactoryFixturesV2,
  type ReferenceStoreFactoryFixtureV2,
} from "@/lib/reference-store-factory-v2";
import type { StoreExperiencePageV2 } from "./StoreExperienceRenderer";
import {
  formatStorefrontAttributeValueV2,
  StoreExperienceRendererV2,
  type ProtectedStorefrontRenderSlotsV2,
} from "./StoreExperienceRenderer";

const fixtures = buildReferenceStoreFactoryFixturesV2();

const slots: ProtectedStorefrontRenderSlotsV2 = {
  commerce: {
    cart: <span data-test-slot="cart">Cart</span>,
    cartPage: <div data-test-slot="cart-page">Cart page</div>,
    checkoutPage: <div data-test-slot="checkout-page">Checkout page</div>,
    productCard: (product) => (
      <article
        data-test-slot="product-card"
        style={{ color: "var(--storefront-color-primary)" }}
      >
        {product.title}
      </article>
    ),
    productGallery: (product) => (
      <div data-test-slot="product-gallery">Gallery for {product.title}</div>
    ),
    purchasePanel: (product) => (
      <div data-test-slot="purchase-panel">Buy {product.title}</div>
    ),
    filterBar: (facets, products) => (
      <div data-test-slot="filter-bar">
        {products.length} results: {facets.join(", ")}
      </div>
    ),
    wishlistControl: (product, label) => (
      <button data-test-slot="wishlist" type="button">
        {label}: {product.title}
      </button>
    ),
    newsletterSignup: ({ title }) => (
      <form data-test-slot="newsletter">{title}</form>
    ),
  },
  policy: {
    merchantIdentity: <span data-test-slot="merchant">Merchant</span>,
    links: <span data-test-slot="policy-links">Policies</span>,
    page: <article data-test-slot="policy-page">Policy</article>,
  },
  content: {
    article: <article data-test-slot="article">Article</article>,
    faq: <div data-test-slot="faq">FAQ</div>,
  },
};

function fixture(key: ReferenceStoreFactoryFixtureV2["key"]) {
  const match = fixtures.find((candidate) => candidate.key === key);
  assert.ok(match);
  return match;
}

function renderFixture(
  key: ReferenceStoreFactoryFixtureV2["key"],
  page: StoreExperiencePageV2,
  preview = true
) {
  const selected = fixture(key);
  return renderToStaticMarkup(
    <StoreExperienceRendererV2
      manifest={selected.revisions[1].manifest}
      catalog={selected.catalog}
      page={page}
      slots={slots}
      preview={preview}
    />
  );
}

function occurrences(value: string, fragment: string): number {
  return value.split(fragment).length - 1;
}

test("validated design tokens form an inheritable slot scope with accessible actions", () => {
  const html = renderFixture("drones", { kind: "home" }, false);

  assert.match(html, /data-storefront-token-scope="v2"/);
  assert.match(html, /--storefront-color-primary:#1d4ed8/);
  assert.match(html, /--storefront-font-heading:ui-sans-serif/);
  assert.match(html, /--storefront-density-space:3rem/);
  assert.match(html, /--storefront-radius:0\.75rem/);
  assert.match(html, /--storefront-product-ratio:1 \/ 1/);
  assert.match(
    html,
    /data-test-slot="product-card" style="color:var\(--storefront-color-primary\)"/
  );
  assert.match(html, /min-h-11/);
  assert.match(html, /focus-visible:ring-2/);
  assert.match(html, /data-experience-hero-layout="split"/);
});

test("closed manifest fields select visibly distinct home, PLP, and PDP compositions", () => {
  const droneHome = renderFixture("drones", { kind: "home" });
  const apparelHome = renderFixture("apparel", { kind: "home" });
  const consumableHome = renderFixture("consumables", { kind: "home" });
  assert.match(droneHome, /data-experience-hero-layout="split"/);
  assert.match(apparelHome, /data-experience-hero-layout="editorial"/);
  assert.match(consumableHome, /data-experience-hero-layout="centered"/);

  const dronePlp = renderFixture("drones", {
    kind: "plp",
    categoryRef: null,
    title: "Drones",
  });
  const apparelPlp = renderFixture("apparel", {
    kind: "plp",
    categoryRef: null,
    title: "Apparel",
  });
  assert.match(dronePlp, /data-experience-plp-layout="sidebar"/);
  assert.match(dronePlp, /<aside aria-label="Catalog filters"/);
  assert.match(apparelPlp, /data-experience-plp-layout="toolbar"/);
  assert.doesNotMatch(apparelPlp, /aria-label="Catalog filters"/);

  for (const [key, layout] of [
    ["drones", "specification-led"],
    ["apparel", "editorial"],
    ["consumables", "repeat-bundle"],
  ] as const) {
    const selected = fixture(key);
    const product = selected.catalog.products[0];
    const html = renderFixture(key, {
      kind: "pdp",
      productRef: product.productId,
    });
    assert.match(html, new RegExp(`data-experience-pdp-layout="${layout}"`));
    assert.equal(
      occurrences(html, 'data-test-slot="product-gallery"'),
      1,
      `${key} renders one protected gallery`
    );
    assert.equal(
      occurrences(html, 'data-test-slot="purchase-panel"'),
      1,
      `${key} renders one protected purchase panel`
    );
    assert.equal(
      occurrences(html, 'data-test-slot="wishlist"'),
      1,
      `${key} renders one wishlist control`
    );
  }

  const apparel = fixture("apparel");
  const apparelPdp = renderFixture("apparel", {
    kind: "pdp",
    productRef: apparel.catalog.products[0].productId,
  });
  assert.match(apparelPdp, /data-gallery-thumbnails="true"/);
});

test("product facts render boolean, list, unit, and unknown values explicitly", () => {
  assert.equal(formatStorefrontAttributeValueV2(true), "Yes");
  assert.equal(formatStorefrontAttributeValueV2(false), "No");
  assert.equal(
    formatStorefrontAttributeValueV2(["navy", "sand"]),
    "navy, sand"
  );
  assert.equal(formatStorefrontAttributeValueV2(28, "min"), "28 min");
  assert.equal(formatStorefrontAttributeValueV2(undefined), "Not stated");
  assert.equal(formatStorefrontAttributeValueV2(""), "Not stated");
  assert.equal(formatStorefrontAttributeValueV2([]), "Not stated");

  const drones = fixture("drones");
  const dronePdp = renderFixture("drones", {
    kind: "pdp",
    productRef: drones.catalog.products[0].productId,
  });
  assert.match(dronePdp, /Obstacle avoidance[\s\S]*?No/);
  assert.match(dronePdp, /Country of origin:<\/strong>\s*Not stated/);
  assert.match(dronePdp, /aria-label="Product category"/);

  const consumables = fixture("consumables");
  const consumablePdp = renderFixture("consumables", {
    kind: "pdp",
    productRef: consumables.catalog.products[0].productId,
  });
  assert.match(consumablePdp, /Whole bean[\s\S]*?Yes/);
});

test("all reference manifests remain compatible with the renderer", () => {
  for (const selected of fixtures) {
    const product = selected.catalog.products[0];
    for (const page of [
      { kind: "home" },
      { kind: "plp", categoryRef: null, title: selected.storeName },
      { kind: "pdp", productRef: product.productId },
    ] satisfies StoreExperiencePageV2[]) {
      const html = renderFixture(selected.key, page);
      assert.doesNotMatch(html, /data-store-experience-invalid="true"/);
    }
  }
});
