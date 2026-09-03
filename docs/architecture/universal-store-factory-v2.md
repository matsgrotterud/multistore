# Universal Store Factory V2

Status: additive local implementation behind disabled-by-default feature gates.
This contract does not authorize provider calls, public routing, checkout,
domains, indexing, legal approval or marketing spend.

## Purpose

Universal Store Factory V2 separates three concerns that the legacy `Product`
and `StoreSettings` rows currently combine:

1. a provider-neutral catalog projection;
2. an allowlisted storefront experience manifest;
3. immutable build and preview revision history.

Supplier adapters may eventually propose offer observations. They never own
storefront composition and never mutate an active preview revision directly.

## Contracts and data flow

```text
StoreBriefV1 + CatalogShapeV1
              |
              v
    CatalogProjectionV2
              |
              v
 StoreExperienceManifestV2 proposal
              |
      deterministic validation
              |
              v
        StoreRevision V1
              |
       admin-only preview
              |
    CAS preview promotion / rollback
```

- Money uses integer minor units and an ISO currency. Missing commercial facts
  stay unknown rather than becoming zero.
- Taxonomy, attributes, variants, collections and media roles are catalog data,
  not provider-specific UI instructions.
- The storefront projection excludes provider keys, external identifiers,
  supplier cost, internal score and raw payloads.
- Experience manifests contain data only. Blocks, navigation, tokens and
  feature flags are closed schemas; authored HTML, CSS and JavaScript are not
  accepted.
- Cart, checkout and policy shells remain application-owned even when their
  safe visual tokens come from a manifest.

## Revision boundary

Build request keys are idempotent and bound to canonical input digests. A
successful build creates an immutable revision plus append-only events. Review
may approve or reject the draft for internal preview; it cannot authorize LIVE.

Each store has one versioned preview pointer. Promotion and rollback compare the
expected pointer version before writing, so stale admin tabs cannot overwrite a
newer decision. Previous immutable revisions remain addressable for diff and
rollback.

The application must check the explicit schema capability before using the
Prisma repository. Build and startup never apply the SQL change automatically.

## Reference acceptance lab

The first renderer proof uses only deterministic synthetic catalogs:

- specification-heavy camera drones;
- shoes/apparel with size, color and variant media;
- a repeat-purchase consumable catalog with bundles and unavailable items.

All three use the same catalog and renderer contracts. Fixture labels must stay
visible in admin and the data must never be represented as supplier or live
commerce evidence.

The generator selects one of three allowlisted compositions from normalized
catalog shape alone:

- specification-led when comparable, facetable product facts dominate;
- variant/editorial when variant density and variant-bound media dominate;
- repeat/bundle when eligible repeat and bundle choices dominate.

The decision uses ratios so one exceptional SKU cannot restyle a whole store.
Taxonomy hierarchy and collection membership determine stable ordering, while
both product and variant attribute definitions feed the same generic facet
surface. No niche name, product slug or provider identifier selects a layout.

The global lab is available at `/admin/store-factory-v2`. An exact store's
workspace is available at `/admin/stores/[slug]/experience?revision=<id>`.
The latter can create a provider-free reference DRAFT only after the feature
flag and exact schema capability both pass. The persisted renderer validates
the stored revision document and tenant binding again before display.

## Wishlist boundary

Wishlist V2 is disabled unless both the experience manifest and deployment
feature flag opt in and a dedicated production signing secret is configured.
An anonymous identity is signed, tenant-bound and HttpOnly. Item identity is
product plus optional variant. Mutation requests require exact same-origin
evidence, and repository operations re-check tenant, visibility and variant
ownership before persistence.

The guest-to-customer merge contract is atomic and deduplicating, but customer
authentication is deliberately separate. A shared admin password and a
checkout email are not customer identity.

The identity, same-origin mutation policy, service and transactional repository
are implemented as a dark foundation. No public wishlist endpoint is opened by
this vertical because there is deliberately no public V2 revision activation
or routing contract yet. This prevents an internal preview approval from
silently becoming a shopper-facing feature.

## Persistence implementation

`CatalogProjectionV2` has a lossless persistence planner and a fixed-table,
parameterized Prisma/PostgreSQL repository. The complete normalized graph is
written in one transaction, replayed only when immutable values match exactly,
and sealed last. Stable product and variant identities may be reused across
artifacts; revisions, taxonomy, collections, attributes, media, purchase
options, evidence, offers and observations stay artifact-scoped.

An offer's latest-observation pointer must be the deterministic maximum of
`(observedAt, observationId)`. Unknown money, shipping and inventory remain
unknown; unavailable offers cannot authorize purchase or a positive bundle
ribbon.

Reference builds first materialize the synthetic catalog idempotently, then
claim a tenant-scoped `StoreBuildRun`. Deterministic QA must pass before the
revision, success settlement and append-only events are finalized atomically.
The action can create only a DRAFT. Separate actions can review or move the
versioned preview pointer; none can update `Store.launchStatus`.

## Manual database checkpoint

No build, startup or admin page runs DDL. Before enabling persistence, review
and apply these additive SQL files to an explicit target in this order:

1. `prisma/schema-changes/20260903_catalog_core_v2_v1.sql`
2. `prisma/schema-changes/20260903_store_factory_v2_revision_v1.sql`
3. `prisma/schema-changes/20260903_store_factory_v2_persistence_hardening_v2_1.sql`

The gate owns this exact order; do not run the individual files against a
shared target. The third file intentionally refuses an already populated V2
control plane because it cannot safely infer catalog bindings for old rows.

Run the read-only verifier against a direct/unpooled connection first:

```bash
DIRECT_URL='postgresql://…' pnpm db:store-factory-v2:verify
```

It prints a secret-free canonical target descriptor containing only normalized
scheme, hostname, explicit/default port and database name. The target
fingerprint binds that descriptor to the identity reported by the connected
PostgreSQL server (address, port, database, role and server version). Changing
environment targets or host aliases therefore changes the confirmation even if
both routes happen to reach a server reporting the same runtime identity.
Credentials and connection-query values are neither printed nor included in
the descriptor. The command also prints a second, versioned fingerprint for the
complete ordered DDL bundle. A manual apply requires copying both fingerprints
explicitly:

```bash
DIRECT_URL='postgresql://…' pnpm db:store-factory-v2:apply -- \
  --confirm-target=sha256:<64-hex> \
  --confirm-ddl=sha256:<64-hex>
```

Apply holds a session advisory lock and combines the reviewed files into one
transaction. `ABSENT` can expand to `COMPLETE`; the exact `COMPLETE` contract is
a no-op; `PARTIAL`, mismatched fingerprints and post-apply attestation failures
are refused. Attestation covers exact required column type/null/default
contracts, check definitions, tenant FKs, indexes, trigger timing/events/mode,
and function signatures/security/bodies.

`verify` may read from `DIRECT_URL`, `DATABASE_URL_UNPOOLED` or `DATABASE_URL`.
`apply` accepts only `DIRECT_URL` or `DATABASE_URL_UNPOOLED`, and rejects
recognizable pooler/PgBouncer hostnames, conventional pooler ports (`6432` and
`6543`) or URL flags before opening a connection. A pooled verify fingerprint
is therefore informational and cannot be reused to authorize apply. Do not
rename a pooled URL into a direct env key; the endpoint check remains
authoritative and fails closed.

Only an exact `COMPLETE` report enables writes. `ABSENT`, `PARTIAL` and
inspection errors all fail closed. `STOREFRONT_V2_ENABLED` remains `false` by
default, and `STOREFRONT_V2_PILOT_STORE_IDS` is empty by default. The pilot list
contains Store IDs, never slugs, and is an additional gate rather than a
replacement for `PREVIEW` and active-store checks.

Persisted admin commands also enforce same-origin requests. Vercel deployment
provenance is recognized explicitly; a non-Vercel reverse proxy may opt in with
`STORE_FACTORY_V2_TRUST_PROXY_HEADERS=true` only when it strips client-supplied
forwarding headers. The default is `false`.

## Rollout

1. Keep all existing stores on the legacy read path.
2. Validate contracts and the three reference fixtures without a database.
3. Review and manually apply the additive schema change to an explicit target.
4. Enable the admin reference lab and persistence only after schema capability
   verification.
5. Shadow-project one store through the legacy adapter and compare V1/V2 output.
6. Enable V2 preview per store; retain immediate pointer rollback.
7. Do not remove legacy columns or open provider/live workflows until parity,
   commerce and launch evidence pass independently.
