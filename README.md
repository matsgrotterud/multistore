# Multi-Store Dropship Factory

One Next.js codebase for many niche storefronts. The app resolves a tenant from host/query/cookie, renders `/s/[store]`, and keeps seeded demo stores, admin, product pages, category pages, guides, cart, checkout stub, SEO and Prisma in one platform.

The current direction is a commerce operating system for many premium niche stores: generated storefronts, provider-backed product discovery, durable media ingestion, candidate review, quality gates, catalog jobs and honest fulfillment modes.

## Local Setup

```bash
pnpm install
pnpm prisma generate
pnpm run db:push:local
pnpm run db:seed:local
pnpm run dev:local
```

Open `/admin` with `ADMIN_PASSWORD`, or preview a store at `/s/drones` or `http://localhost:3010/?store=drones`.

If you see `Store table does not exist`, run `pnpm run db:doctor` — it checks every env file for duplicate `DATABASE_URL` lines (last value wins) and reports which Neon database has your stores. Use `dev:local` / `db:push:local` / `db:seed:local` so commands always read `.env.local`.

## Database Troubleshooting

Never run `vercel env pull .env.local` directly. It can overwrite local database settings and leave `DATABASE_URL` or `DIRECT_URL` empty. Pull Vercel env into `.env.vercel` instead:

```bash
vercel env pull .env.vercel
```

When Prisma complains that the `Store` table does not exist, run:

```bash
pnpm run db:doctor
```

It inspects `.env`, `.env.local`, `.env.vercel`, `.env.production.local`, and `.env.local.backup*`, redacts credentials, probes each unique Postgres URL, and recommends the database that already has Multistore stores.

When `DATABASE_URL` is empty or duplicated in `.env.local`, run:

```bash
pnpm run db:repair-local
```

The repair script backs up `.env.local`, keeps one DB URL per key, prefers the database with `Store` rows, sets `MEDIA_STORAGE_PROVIDER=local`, and sets `NEXT_PUBLIC_SITE_URL=http://localhost:3010`. It does not push schema or seed data.

## Required Credentials

The app works locally with `MEDIA_STORAGE_PROVIDER=local`, `MOCK_CHECKOUT=true` and the `mock` provider. For production, get these first:

| Need | Env vars |
| --- | --- |
| Database | `DATABASE_URL`, `DIRECT_URL` |
| Admin | `ADMIN_PASSWORD` (12+ characters), plus `ADMIN_SESSION_SECRET` (32+ characters in production) |
| Cron protection | `CRON_SECRET` |
| Runtime object storage | `BLOB_READ_WRITE_TOKEN`, `MEDIA_STORAGE_PROVIDER=vercel-blob` |
| Stripe checkout | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `CHECKOUT_FINALIZATION_SECRET` (32+ characters), `PAYMENT_CAPTURE_MODE=manual` |
| CJdropshipping | `CJ_ENABLED`, `CJ_API_KEY`, optional `CJ_ACCESS_TOKEN`/`CJ_REFRESH_TOKEN`; live order API also needs `CJ_ORDER_API_ENABLED=true`, `CJ_ORDER_PAY_TYPE=2`, `CJ_LOGISTIC_NAME`, `CJ_FROM_COUNTRY_CODE`; Phase 1 manual ordering can use `CJ_MANUAL_FULFILLMENT_ENABLED=true` |
| Doba | `DOBA_ENABLED`, `DOBA_ACCESS_KEY`, `DOBA_APP_KEY`, `DOBA_APP_SECRET` |
| eBay Browse API | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, optional `EBAY_EPN_CAMPAIGN_ID` |
| AliExpress affiliate/open platform | `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`, `ALIEXPRESS_TRACKING_ID` |
| AI copy later | `OPENAI_API_KEY`, `AI_PROVIDER` |

Other provider env vars are scaffolded in `.env.example` for Temu, Amazon, Wish and Alibaba. They stay `NOT_CONFIGURED` until authorized credentials are present.

LIVE checkout, supplier routing and the Google feed also require both
`lastSupplierSyncAt` and the persisted V3 product evaluation to be no older
than `CATALOG_FRESHNESS_MAX_AGE_HOURS` (48 hours by default, bounded to 1–168).
`REFRESH_EXISTING` now performs a provider-backed **shadow refresh**. It records
versioned, normalized supplier snapshots and immutable-while-retained
`CatalogSupplierObservation` and proposal-fact records. Parent-retention deletes
may still cascade by design. The scan cursor,
current per-product state, evidence and exact lease-fenced job transition are
committed atomically. Bounded `CatalogSyncRun.summaryJson` remains diagnostics
only. Shadow refresh deliberately does not mutate Product, variants, media,
quality status or `lastSupplierSyncAt`. The first observation is a baseline, and
subsequent observations can become `NO_CHANGE`, `PROPOSED`, `REVIEW_REQUIRED` or
`SOURCE_UNAVAILABLE`. A separately reviewed atomic apply/re-evaluation step is
still required before this evidence can reopen LIVE commerce.

Each successful observation also compares like-for-like operational storefront
facts with the supplier snapshot: route/source, authoritative stock, delivery
window, identity fields, variant identities and supplier-media sources. Retail
price and normalized cost are intentionally excluded until the pricing engine
can recompute FX, margin and shipping policy from the same snapshot. Provider
health canaries are coalesced for 60 seconds inside one worker process; product
detail reads are never skipped by that cache.

The additive PostgreSQL DDL for this durable read model lives at
`prisma/schema-changes/20260831_catalog_autopilot_v1.sql`. The expansion is an
explicit deploy step: it is intentionally absent from `build`, `postinstall` and
application startup. The admin history is paginated from durable observations
and manual observations are queued idempotently; the admin action never calls a
supplier inline and never applies a proposal.

### Catalog Autopilot expand-before-code gate

Run these steps from the code revision whose Prisma schema and DDL will be
deployed. The default commands use the already-exported `DATABASE_URL`; the
`:local` variants explicitly load `.env.local`. Neither verify command writes to
the database, and no command prints a connection URL or credentials.

1. Inspect the exact target before deploying application code:

   ```bash
   pnpm run db:catalog-autopilot:verify
   # Local target instead:
   pnpm run db:catalog-autopilot:verify:local
   ```

   Copy the complete `sha256:...` target fingerprint from the output. `ABSENT`
   is the expected state before the first expansion. `PARTIAL` means stop and
   reconcile the schema manually; the apply command will refuse it.

2. Expand only that exact target by pasting the full fingerprint into the
   matching command:

   ```bash
   pnpm run db:catalog-autopilot:apply -- --confirm-target=sha256:<full-64-hex-digest>
   # Local target instead:
   pnpm run db:catalog-autopilot:apply:local -- --confirm-target=sha256:<full-64-hex-digest>
   ```

   A missing or different fingerprint is refused before connecting. Apply takes
   a database advisory lock, refuses any partial installation, runs only the
   canonical additive transaction, and verifies it afterward. If the full
   contract is already installed, apply is an idempotent no-op.

3. Run the same verify command again and require `Schema status: COMPLETE`.
   Only then deploy the application code that reads the new models.

For an explicitly exported unpooled connection, append
`-- --url-env=DIRECT_URL` to both verify and apply, and keep the selected env key
identical across both commands. The gate checks all five tables, critical
columns, contract checks, scope/immutability triggers and required indexes.

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
| `cj` | Official API token/search/detail/media scaffold; order creation is gated behind explicit CJ order env and remains pending unless CJ pay type confirms fulfillment |
| `doba` | Credential-aware scaffold; product/order endpoints stay disabled until the Doba API contract is confirmed |
| `ebay` | Official Browse API search/details when OAuth env vars exist; affiliate mode by default |
| `aliexpress` | Signing scaffold plus fixture mode; no checkout unless explicitly enabled later |
| `temu`, `amazon`, `wish`, `alibaba` | Health/capability scaffolds; no checkout claims |

CJ API traffic is serialized and paced at one transport boundary inside each worker process. Every actual CJ HTTP start uses that boundary, including token refresh, primary/fallback authentication and API calls; high-level provider calls are not double-gated. Catalog operations use one abort signal and bounded deadline across authentication, queueing and API fetches. This is not a distributed/account-wide limiter: multiple serverless or Node instances sharing one CJ credential still require a dedicated supplier worker or API-key-scoped distributed rate limiter before horizontal production scale.

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
[
  { "path": "/api/cron/catalog-sync", "schedule": "0 3 * * *" },
  { "path": "/api/cron/job-worker", "schedule": "*/5 * * * *" }
]
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

Jobs are small-batch and lock rows with `CatalogJob.lockedAt/lockedBy`, so one
run does not try to process every store at once. Terminal writes are fenced to
the exact worker lease, the sequential runner claims one job at a time, and
unknown or unimplemented job types fail instead of becoming false successes.
Scheduler job IDs are deterministic per store/provider/cadence bucket, so
repeated cron invocations do not create duplicate discovery or refresh work.
Portfolio plans are inserted in bulk (two writes for refresh and discovery),
so 100 stores do not require hundreds of serial scheduler round trips. The
frequent worker gives `ROUTE_ORDER` first claim priority so catalog backlogs do
not delay paid-order handling; catalog work remains FIFO within its class.
The scheduler considers every configured active store (up to the explicit
500-store safety bound) in stable order; mock automation requires
`CATALOG_ALLOW_MOCK_AUTOMATION=true`.

## Fulfillment Modes

Products can be `DROPSHIP`, `AFFILIATE`, `MANUAL` or `MOCK`.

Automatic supplier ordering must only be enabled when the provider has an approved checkout/order API. Otherwise the product stays affiliate/manual/mock and should not pretend automatic fulfillment exists.

Stripe PaymentIntent checkout is available when `MOCK_CHECKOUT=false` and Stripe keys exist. Use `PAYMENT_CAPTURE_MODE=manual` for dropship mode: the app authorizes payment first, routes the order to an approved provider, and only captures when fulfillment is confirmed. If a provider returns pending or errors, the uncaptured PaymentIntent is left authorized or cancelled instead of pretending fulfillment succeeded.

For Phase 1 CJ products can be sold without automatic CJ order placement by setting `CJ_MANUAL_FULFILLMENT_ENABLED=true`. This creates `MANUAL_ACTION_REQUIRED` supplier orders with product/variant IDs and shipping details for admin placement in CJ; it never marks the supplier order as placed by CJ.

Mock checkout remains available for local development with `MOCK_CHECKOUT=true`.

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
