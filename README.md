# Multi-Store Dropship Factory

One Next.js codebase for many niche storefronts. The app resolves a tenant from host/query/cookie, renders `/s/[store]`, and keeps seeded demo stores, admin, product pages, category pages, guides, cart, checkout stub, SEO and Prisma in one platform.

The current direction is a commerce operating system for many premium niche stores: generated storefronts, provider-backed product discovery, durable media ingestion, candidate review, quality gates, catalog jobs and honest fulfillment modes.

## Local Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open `/admin` with `ADMIN_PASSWORD`, or preview a store at `/s/drones`.

## Required Credentials

The app works locally with `MEDIA_STORAGE_PROVIDER=local`, `MOCK_CHECKOUT=true` and the `mock` provider. For production, get these first:

| Need | Env vars |
| --- | --- |
| Database | `DATABASE_URL`, `DIRECT_URL` |
| Admin | `ADMIN_PASSWORD` |
| Cron protection | `CRON_SECRET` |
| Runtime object storage | `BLOB_READ_WRITE_TOKEN`, `MEDIA_STORAGE_PROVIDER=vercel-blob` |
| eBay Browse API | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, optional `EBAY_EPN_CAMPAIGN_ID` |
| AliExpress affiliate/open platform | `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`, `ALIEXPRESS_TRACKING_ID` |
| AI copy later | `OPENAI_API_KEY`, `AI_PROVIDER` |

Other provider env vars are scaffolded in `.env.example` for Temu, Amazon, Wish and Alibaba. They stay `NOT_CONFIGURED` until authorized credentials are present.

## Architecture

Key runtime paths:

```text
src/app/s/[store]/...              Storefront routes
src/app/admin/import               Candidate review/import UI
src/app/api/cron/catalog-sync      Daily catalog jobs
src/lib/suppliers/providers        Provider contracts and adapters
src/lib/catalog                    Candidate service and quality gates
src/lib/media                      Fetch/hash/ingest/sync media pipeline
src/lib/storage                    Local/Vercel Blob storage providers
src/lib/jobs                       Catalog queue and runner
prisma/schema.prisma               Multi-tenant commerce schema
```

Product discovery flow:

```text
StoreSupplierSettings/import query
  -> CommerceProvider.searchProducts()
  -> ProductCandidate upsert
  -> scoreCandidate + quality gates
  -> admin approve/reject
  -> import as Product draft/noindex
  -> ProductMediaAsset + ProductImage compatibility mirror
```

Supplier search never creates a live product directly. Imported products remain unpublished/noindex until a later quality review marks them ready.

## Provider Capability Model

Every provider exposes explicit capabilities: search, details, images, video, pricing, inventory, checkout, tracking, returns and affiliate links. Missing credentials return `NOT_CONFIGURED` health and do not crash catalog jobs.

Current providers:

| Provider | Status |
| --- | --- |
| `mock` | Functional local discovery/media ingestion |
| `ebay` | Official Browse API search/details when OAuth env vars exist; affiliate mode by default |
| `aliexpress` | Signing scaffold plus fixture mode; no checkout unless explicitly enabled later |
| `temu`, `amazon`, `wish`, `alibaba` | Health/capability scaffolds; no checkout claims |

The project intentionally does not use captcha bypasses, login-wall bypasses, marketplace scraping or reader proxies for AliExpress, eBay, Temu, Amazon, Wish or Alibaba. Use official APIs, affiliate APIs, authorized feeds, supplier-provided feeds or user-provided URLs where fetching is allowed.

## Media Ingestion

Dynamic supplier media is stored at runtime, not committed to Git and not written to `public/catalog`.

Local dev stores under:

```text
public/uploads/dev-media
```

Production should use Vercel Blob with `BLOB_READ_WRITE_TOKEN`. `fetchMedia` only accepts `http`/`https`, rejects unsafe URL schemes, enforces content type/size limits, computes SHA-256 hashes and dedupes stored assets by hash.

`ProductMediaAsset` is the durable media model. `ProductImage` is kept in sync for existing storefront compatibility.

## Catalog Jobs

Vercel cron is configured in `vercel.json`:

```json
{ "path": "/api/cron/catalog-sync", "schedule": "0 3 * * *" }
```

In production the route requires:

```text
Authorization: Bearer $CRON_SECRET
```

Local scripts:

```bash
npm run catalog:health
npm run catalog:discover
npm run catalog:run-jobs
npm run catalog:sync
```

Jobs are small-batch and lock rows with `CatalogJob.lockedAt/lockedBy`, so one run does not try to process every store at once.

## Fulfillment Modes

Products can be `DROPSHIP`, `AFFILIATE`, `MANUAL` or `MOCK`.

Automatic supplier ordering must only be enabled when the provider has an approved checkout/order API. Otherwise the product stays affiliate/manual/mock and should not pretend automatic fulfillment exists.

Checkout is still a local mock payment flow. The schema now includes `Customer`, `Order`, `OrderItem` and `SupplierOrder` for the next order-routing phase.

## Quality Gates

Candidates are rejected or require manual review for risky categories such as supplements, medical/cosmetic claims, baby safety products, regulated drones, batteries/chargers without safety info, weapons, adult/restricted products and counterfeit/trademark risk.

A product needs source info, shipping estimate, acceptable margin, enough supplier media and a passing score before it can move toward publication. No fake reviews, fake sales counts, fake scarcity or fake local stock are generated.

## Admin Import

`/admin/import` now shows:

- provider health and missing env vars
- discovery form by store/provider/query
- latest candidates
- score, media ingestion count and rejection reason
- approve/reject buttons
- import approved candidates as draft products
- latest sync runs

## Adding A Provider

1. Add an adapter in `src/lib/suppliers/providers`.
2. Implement the `CommerceProvider` contract.
3. Validate normalized outputs with the shared Zod schemas.
4. Add it to `registry.ts`.
5. Store raw provider signals in candidate/product JSON for audit.
6. Keep unsupported checkout/tracking as explicit unsupported capabilities.

## Launching Many Stores Safely

Use preview/noindex for generated stores, configure providers per store, import candidates into review, publish only products that pass quality gates, and keep merchant feeds limited to live fulfillable products with stored images. Scale by adding StoreSupplierSettings and catalog jobs, not by copying apps.

