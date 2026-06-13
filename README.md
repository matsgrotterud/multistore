# Multi-Store Dropship Factory

One Next.js codebase that serves **many niche ecommerce storefronts**, each on its own domain with its own brand, theme, catalog, content, SEO strategy and Merchant feed. Five complete demo stores ship in the seed:

| Store | Slug | Example domain | Personality |
| --- | --- | --- | --- |
| Skyforge Drones | `drones` | dronestore.example | Technical, performance-oriented |
| Bamboo Smile | `bamboo-toothbrushes` | bambussmil.example | Calm, sustainable, subscription-friendly |
| UprightWorks | `ergonomic-office` | ergonomikontor.example | Professional, health-focused |
| Fur & Friends | `pet-grooming` | pelspleie.example | Warm and friendly |
| Ridgeline Supply | `hiking-gear` | turklar.example | Rugged and practical |

This is **not** 40 separate projects — it is one multi-tenant platform. The middleware resolves the store from the Host header and rewrites internally to `/s/[storeSlug]` while visitors see clean canonical URLs.

## Local setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Then open:

- http://localhost:3000/?store=drones (or any other slug) — sets a store cookie and rewrites
- http://localhost:3000/s/bamboo-toothbrushes — direct internal path
- http://localhost:3000/admin — admin (password = `ADMIN_PASSWORD`, default `changeme`)
- http://localhost:3000/api/feeds/google?store=hiking-gear — Merchant feed
- http://localhost:3000/sitemap.xml and /robots.txt — per-host SEO endpoints

## Environment variables

Copy `.env.example` to `.env` (a working `.env` is included for local dev):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` locally; a Postgres URL in production |
| `ADMIN_PASSWORD` | Protects `/admin`. Change it. |
| `NEXT_PUBLIC_DEFAULT_STORE` | Fallback store slug when no domain/cookie/query matches |
| `MOCK_CHECKOUT` | `true` = simulated checkout; set `false` once a real provider is wired in |

## Architecture

```
src/
  middleware.ts             Host/query/cookie -> /s/[storeSlug] rewrite (edge)
  config/domain-map.ts      hostname -> store slug map (edge-safe, ~40 slots)
  app/
    s/[store]/...           All storefront routes (home, c/, p/, guides/, compare,
                            quiz, cart, checkout, search, policies/)
    admin/...               Dashboard, stores, products, generator (+ login)
    api/feeds/google        Google Merchant Center feed (XML)
    api/track               First-party analytics sink -> CartEvent table
    api/placeholder         Deterministic branded SVG images (offline-friendly)
    robots.ts, sitemap.ts   Per-host, store-scoped
  lib/
    tenant/                 DB-backed tenant resolution (sitemaps/feeds)
    stores/queries.ts       Store-scoped data access layer (React cache)
    seo/                    metadata, jsonld, canonical, sitemap builders
    pricing/                Margin-safe price engine + currency formatting
    products/product-score  0-100 commercial score (drives featuring/sorting)
    suppliers/              SupplierAdapter interface + mock + import pipeline
    payments/               PaymentProvider interface + mock (Stripe-ready)
    ai/                     Blueprint/copy generation + content guardrails
    monetization/           Margin, bundles, upsell/subscription insights (admin-only)
    analytics/              Event taxonomy + consent-gated client tracking
    quiz/                   Per-niche quiz configs + recommendation scoring
    cart/                   localStorage cart context (per store)
  components/               25+ storefront components (server-first, client leaves)
prisma/
  schema.prisma             SQLite locally, Postgres-compatible
  seed.ts + seed-data/      5 complete stores, validated with Zod
```

### How multi-tenant routing works

1. **Production**: a request to `dronestore.example/p/aero-s1-mini-4k` hits the middleware, which looks up the hostname in `src/config/domain-map.ts` and rewrites to `/s/drones/p/aero-s1-mini-4k`. The address bar keeps the clean URL.
2. **Local dev**: `/?store=drones` (query param) or `/s/drones` (direct path) selects the tenant; a cookie (`msdf_store`) remembers it so subsequent clean URLs resolve correctly.
3. **Canonical URLs** always point at the store's primary domain with clean paths — `/s/...` is never canonical, and robots.txt disallows it.
4. All internal links are clean paths (`/p/...`, `/c/...`), so the same components work on every domain.

### Adding a new store/domain

1. Generate a blueprint in `/admin/generator` (deterministic mock AI; output is guardrail-checked JSON matching the seed format).
2. Add a seed module in `prisma/seed-data/` (copy an existing store) and register it in `prisma/seed.ts`; run `npm run db:seed`.
3. Map the hostname in `src/config/domain-map.ts` (edge) — the Domain table covers server-side resolution automatically.
4. Point DNS at the deployment. Done — same build serves the new tenant.

## SEO & structured data

- `generateMetadata` on every page: title, description, canonical (store domain), Open Graph + Twitter cards with image fallback.
- JSON-LD: Organization + WebSite (layout), Product + Offer + BreadcrumbList (product pages), ItemList (category/compare), Article (guides), FAQPage **only when the FAQ is visibly rendered**.
- **Honesty rules enforced in code** (`src/lib/seo/jsonld.ts`, `src/lib/ai/content-guardrails.ts`): no AggregateRating without real rating data, no fake reviews, no fake scarcity, no implied local stock, availability mirrors real `stockStatus`.
- Categories with fewer than 3 published products are noindexed and excluded from the sitemap; unpublished/noindex pages never appear in sitemap or feed.
- Sitemap and robots are generated per Host — each domain only advertises its own URLs.

## Supplier adapters

`src/lib/suppliers/types.ts` defines the `SupplierAdapter` interface (`searchProducts`, `getProduct`, `normalizeProduct`, `estimateShipping`, `calculateLandedCost`). The mock adapter (`mock-supplier.ts`) runs offline; `import-products.ts` is the full pipeline: search → normalize → price (margin-safe) → score → upsert **unpublished** for review. Implement the interface against a real supplier API and pass it to `importProductsForStore` — nothing else changes.

## Payment adapter

Checkout (`src/lib/actions/checkout.ts`) re-prices every line item from the database, runs internal margin-safe warnings (logged, never shown to users), and calls `getPaymentProvider()` from `src/lib/payments/payment-provider.ts`. The mock provider simulates success while `MOCK_CHECKOUT=true`. A Stripe implementation sketch is included in the file — implement `PaymentProvider`, switch the factory, done.

## Google Merchant feed

`/api/feeds/google` emits RSS 2.0 XML with the `g:` namespace, resolved per host (or `?store=`). Only published products are included; GTIN is emitted when present (otherwise `identifier_exists=false`). **Before submitting to a real Merchant Center account**: product data, shipping settings, tax, return policy and business information must be accurate and verified — the route's comments spell this out. The feed is a structural starting point, not a compliance guarantee.

## Analytics & consent

First-party events (`page_view`, `product_view`, `add_to_cart`, `begin_checkout`, `checkout_success`, `quiz_start`, `quiz_complete`, `newsletter_signup`, `guide_view`, `merchant_feed_view`) are logged to the console in dev and persisted as `CartEvent` rows — but **only after the visitor opts into analytics cookies**. The consent banner gives accept and reject equal visual weight, and no marketing script loads before a positive decision.

## Compliance notes

- Every store publishes shipping, returns, privacy and terms pages generated from its own store record.
- Dropshipping transparency is enforced by design: supplier fulfillment disclosure, realistic delivery windows on every product, import-tax disclaimers, support contact on every policy page.
- Seeded products have `ratingAverage: null` — the UI states "no reviews yet" instead of faking social proof.
- The content guardrails flag thin/duplicate content (recommend noindex), fake claims, and copy implying local stock.
- Replace the seed legal copy with lawyer-reviewed text per market before launching commercially.

## Deployment notes

1. Switch the Prisma datasource to `postgresql` and set `DATABASE_URL`; optionally convert the JSON-encoded String columns to native `Json` and the documented String enums to native enums (SQLite limitation only).
2. `npx prisma migrate deploy` (or `db push` for previews), then seed or import real catalog data.
3. Point all store domains at the deployment (e.g. Vercel: add each domain to the project). The middleware does the rest.
4. Set a strong `ADMIN_PASSWORD` — and put real auth in front of `/admin` before exposing it publicly.
5. Replace `/api/placeholder` image URLs with real product imagery on a CDN (add the hostname to `next.config.ts` `images.remotePatterns`).
6. Set `MOCK_CHECKOUT=false` only after wiring a real `PaymentProvider`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (next/core-web-vitals + TS) |
| `npm run typecheck` | `tsc --noEmit` (strict mode) |
| `npm run db:push` | Apply schema to the database |
| `npm run db:seed` | Seed the 5 demo stores (idempotent) |
| `npm run prisma:studio` | Browse the database |
