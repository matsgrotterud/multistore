# Generator V3: truth chain and operator contract

Status: implemented local foundation and operating contract; not a production-readiness or live-commerce attestation.

Generator V3 exists to make one claim trustworthy: a generated preview contains products from the product class the merchant requested. Design, copy, SEO, margin and supplier scores are downstream concerns and can never repair a false catalog.

## System boundary

The V3 truth chain is:

```text
admin input
  -> NicheIntentV1 + policy
  -> class-first query plan
  -> provider attempts
  -> normalized, deduplicated supplier candidates
  -> CandidateEvaluationV1
  -> durable media and variant checks
  -> inactive DRAFT staging
  -> minimum-catalog decision
  -> noindex PREVIEW or honest terminal failure
  -> admin evidence
  -> fail-closed storefront reads
```

The invariant is stronger than a ranking score: every preview-visible product must have positive supplier evidence for the resolved primary product class. A query, generated category, qualifier, margin, image or merchandising term is not class evidence. If the intent or catalog cannot be proved, the run ends without an active preview.

The implementation is deliberately limited to catalog generation and internal preview. It does not activate DNS, advertising, production payment, supplier orders or fulfillment.

## Versioned contracts

| Concern | Current contract | Authority |
|---|---|---|
| Niche intent | `niche-intent.v1` | Canonical class, class concepts, qualifiers, exclusions, confidence and policy outcome |
| Product ontology | `product-ontology.v1` | Controlled aliases, conflicting classes, risk flags and one honest class category |
| Query plan | `class-query-plan.v1` | Retrieval queries; every query is anchored in a class concept |
| Candidate evaluation | `candidate-evaluator.v1` | Separate relevance, policy, provenance, media, variant, price, shipping, risk, preview and live gates |
| Candidate/generation policy | `generator-policy.v1` | Converts hard-gate evidence into `ALLOW`, `REVIEW` or `BLOCK` |
| Generation result | `generation-result.v1` | Discriminated terminal state and exact catalog counts |
| Generation audit | `generation-run.v1`, generator `generator.v3` | Durable input, versions, phases, provider attempts, counts, reasons and result |
| Provider search | `provider-search.v1` | Typed attempt outcomes, bounded retries and provider pacing |
| Storefront visibility | `catalog-visibility.v3` | One read-time visibility decision for non-LIVE catalogs |
| Reference pipeline | `generator-pipeline.v1` | Adapter contract for tenant-scoped discovery, staging and atomic preview commit |
| Go-live | `go-live-evidence.v3`, gate `go-live-gate.v3.0.0` | Pure, fail-closed `PREVIEW -> LIVE` decision |

Contracts are additive boundaries, not labels for unverified data. A consumer must reject missing or incompatible evidence instead of silently treating it as a pass.

### Intent and query planning

`resolveNicheIntentV1` maps normalized merchant input to a controlled product class. The initial ontology covers reviewed camera drones, slippers, dog toys, slime kits, fishing lures/bait and shoes. Unknown or ambiguous niches return insufficient intent evidence; they do not fall back to generic `Featured`, `Premium`, `Everyday` or `Accessories` categories.

`buildClassQueryPlanV1` uses required class concepts and optional qualifiers. A qualifier such as `fluffy`, `warm` or `premium` can refine a class-first query, but cannot appear as the only product-class proof.

### Candidate evidence boundary

Positive relevance evidence may come from the supplier's raw title, cleaned visible description, provider taxonomy path, verified specs and variant attributes. Query text, the generated storefront category, rewritten copy and scores are retained only as provenance or merchandising context.

The evaluator records `PASS`, `FAIL`, `UNKNOWN` or `REVIEW`, reason codes, explanations, evidence fields, evaluator version and timestamp. Relevance is a hard gate. A totalscore can rank candidates only after the gate; it cannot compensate for a missing or conflicting class.

Risk matching runs on visible normalized product text rather than raw URLs or HTML attributes. Media readiness counts durable usable assets, and `image/jpg` is normalized to `image/jpeg`. Declared supplier media is not a stored-media receipt.

### Terminal generation states

| State | Admin treatment | Store effect |
|---|---|---|
| `READY_FOR_PREVIEW` | Green | Eligible for an internal noindex preview; still not live approval |
| `READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW` | Amber | Internal noindex preview; policy and live commerce remain blocked |
| `INSUFFICIENT_RELEVANT_PRODUCTS` | Red | Inactive `DRAFT`; never padded with off-niche products |
| `INSUFFICIENT_INTENT_EVIDENCE` | Red | No storefront is created by the admin action |
| `PROVIDER_FAILED` | Red | Inactive `DRAFT`; provider failure is not converted to a warning-success |
| `VALIDATION_FAILED` | Red | Inactive `DRAFT`; staged work is compensated where the current adapter permits |
| `CANCELLED` | Red | No preview authorization |

`previewReady` means only that the catalog contract permits a noindex internal preview. It does not mean launch-ready, payment-ready or supplier-order-ready.

## Generation run, idempotency and staging

The application currently reuses the existing `CatalogSyncRun` model as the durable Generator V3 run. The normalized key is prefixed with `genv3-` and stored as the run ID. A unique-key collision is read as an existing run only when it is a valid Generator V3 audit record.

The run summary records original and normalized input, generator/intent/ontology/evaluator versions, intent, policy, query attempts, counts, phases, reason codes, terminal result, timestamps and an optional `storeId`.

Retry semantics are intentionally conservative:

- A repeated terminal key returns the persisted result when it has the expected contract.
- A repeated non-terminal key is rejected instead of creating another store.
- Provider/external ID is the candidate identity; first deterministic discovery owns category assignment.
- The remaining import budget is passed through the import path, so the persisted total cannot intentionally exceed the selected budget.
- A corrected hypothesis needs a deliberate new run key; do not reuse a completed key and expect different output.

The current Prisma-backed application path stages a store as inactive `DRAFT`, links it to the run, imports/evaluates candidates, checks the minimum catalog, and only then changes it to active `PREVIEW`. Grounded FAQ, guide and collection content is created only after the preview contract passes. On an unhandled failure, the action records `VALIDATION_FAILED` and forces any linked store back to inactive `DRAFT`.

This is explicit compensation, not a claim of full database/storage atomicity. `generator-pipeline.v1` defines the stronger target boundary: media receipts are staged, `commitPreview` is the only visible write and must be atomic, and failed media/persistence calls discard staged receipts. Its current adapters are deterministic test/reference adapters; the admin generator is not yet wired through a production Prisma/media implementation of that interface.

Provider search failures remain distinct from zero results. Search attempts record provider, query, attempt, status, timing, result count and error details. CJ's single process-local transport boundary paces every actual CJ HTTP start by at least 1.1 seconds, including token refresh, primary and fallback authentication, health, search, detail/media, variant lookup and order submission. The high-level catalog deadline is intentionally outside that gate and carries one abort signal through authentication, queueing and API fetches; this avoids nested gate acquisition when one logical call needs more than one CJ HTTP request.

This CJ gate is intentionally process-local. It prevents bursts and overlap inside one worker, but it does not coordinate multiple Node processes, serverless instances or deployments that share a CJ credential. Production scale-out therefore still needs an API-key-scoped distributed limiter (or a single dedicated supplier worker); the current implementation must not be described as an account-wide rate-limit guarantee.

## Catalog selection v1

The Prisma generator runtime now resolves one explicit provider plan before it
creates the execution fingerprint. Normal/configured generation defaults to CJ;
the synthetic `mock` provider can enter only through an explicit caller choice
(the guarded admin demo checkbox). A configured `mock` fallback is rejected.
AliExpress fixtures are not exposed through the live provider key, and provider
capabilities remain false for order/tracking operations that have no adapter.

`catalog-selection.v1` compares a bounded pool larger than the requested output
and chooses exactly 8 (`small`) or 12 (`standard`/`broad`) products before a
preview can pass. Relevance, supplier identity, explicit stock, unit cost,
known freight cost, one comparable currency, shipping-window evidence/limit,
durable media and variant identity are hard gates. Positioning-aware
affordability, supplier score, margin, shipping, media,
stock and title novelty rank only candidates that passed those gates. A cheap or
semantically attractive item can never compensate for failed evidence.

The result is a deterministic, versioned manifest. Selected, rejected and
reserve dispositions are CAS-written to candidate signals; selection evidence
and approval are committed together against the exact ranked snapshot, and the
atomic import claims that approved row by its new timestamp. Full selection
plans are also retained in the generation-run summary. Affordability currently
means relative recorded supplier acquisition cost plus recorded freight within
one currency—it is not proof of the cheapest market offer, demand or
profitability. Missing freight evidence or an incomparable currency is rejected,
not treated as zero or converted implicitly.

A server-only client contract exists for the future shared AI Hub capability
`multistore.catalog-product-selection.v1@1.0.0`. It validates a proposal-only
response, pins tenant/capability/version/idempotency, rejects redirects and
out-of-scope candidate IDs, and never retries or falls back ambiguously. It is
not invoked by generation yet: AI Hub does not currently have an active
Multistore capability or principal, so claiming real model-backed selection
would be false. Deterministic Multistore gates remain authoritative even after
that capability is released.

The reviewed `electronics.camera-drones` ontology class supports an internal
noindex preview for the explicit `drone` intent. Drone, battery and charger terms
become manual-review evidence only for that exact review-only class; the same
terms remain hard rejections elsewhere. Drone accessories, replacement parts,
toy-only drones and unrelated cameras are excluded. Live commerce and autonomous
launch remain blocked by policy.

## Read-only growth advice

The store editor includes a deterministic 28-day growth advisor. Only persisted
`CAPTURED` orders on the canonical Stripe path with a Stripe payment-intent ID
count as sale evidence. Consented `CartEvent` funnel data is explicitly advisory
and spoofable; client `checkout_success` never counts as a sale. PREVIEW/DRAFT
stores receive launch/measurement advice but no paid marketing recommendation.
A live store becomes eligible only for a human-reviewed scale experiment when
captured contribution is positive, catalog evidence is fresh and every order,
fulfillment and supplier-order state is on the explicit success allowlist.
Unknown states fail closed. The advisor never mutates products, SEO, domains,
publication state or spend.

## Preview publication and legacy quarantine

`catalog-visibility.v3` is the common non-LIVE read policy. A persisted V3 evaluation is visible only when relevance passes, policy is not failed and preview visibility passes. V3 publication also requires supplier identity, usable stored media, variant identity, grounded content and no hard risk veto through the candidate policy.

The storefront data layer performs PREVIEW/DRAFT reads in two stages: it first selects only visibility evidence, applies a coarse database filter and the authoritative evaluator, then loads rich relations only for accepted IDs. This keeps rejected supplier payloads out of rendered React Flight responses and makes a direct off-niche product route return no product/404.

The policy is applied to homepage/featured products, categories, product routes, related products, search and ID-based recommendations used by quiz/collections. Checkout preparation rechecks visibility. Non-LIVE stores expose no Merchant Center products or sitemap entries, and host-resolved robots policy disallows crawling.

Existing PREVIEW rows without V3 evidence are re-evaluated from stored supplier/raw evidence at read time. This quarantines off-niche legacy products without mutating or deleting their database rows. `mediaStatus=OK` is accepted only as a legacy read-time compatibility proxy; it is not valid V3 generation or publication evidence. Existing `LIVE` catalogs remain compatibility-preserved until a separately reviewed backfill exists.

## Storefront presentation and grounded content

The landing page is intentionally downstream of catalog truth. It can use a responsive hero, banner and category/product composition only from products that passed visibility. Real eligible product media may support the hero; invented reviews, testing claims, tracking guarantees, local fulfillment, support SLAs or certifications may not.

An amber review banner identifies manual-review previews. If the catalog is insufficient, the page uses an honest empty/error state instead of unrelated filler. Preview pages remain noindex even when the visual layer is polished.

## Admin operating procedure

1. Generate a blueprint, then create the store once. The UI holds a stable idempotency key for that attempt.
2. Read the terminal state before opening a preview. Green is reserved for `READY_FOR_PREVIEW`; manual review is amber; insufficient/provider/validation states are red.
3. Inspect run ID, normalized product class, confidence, policy, actual provider attempts, discovered/rejected/relevant/imported/preview-visible counts, exact budget and grouped reason codes.
4. Inspect candidate-level relevance state, supplier evidence and evaluator version in the import diagnostics when a catalog is rejected.
5. For an insufficient catalog, fix the intent/provider evidence and start a new hypothesis. Never lower relevance or manually publish unrelated rows to fill the budget.
6. For a manual-review preview, inspect products and policy evidence, but keep it noindex and do not interpret the preview checkout as live-commerce approval.
7. Use `pnpm run debug:generation:local -- --latest` for the latest persisted generator diagnostics. Do not edit the generation JSON to manufacture approval.

The store editor exposes the persisted generation snapshot and current live blockers. Ordinary settings saves preserve the system-owned generation record.

## Go-live is a separate evidence decision

`canTransitionToLive` is pure and denies transition when evidence is missing, unknown, stale-by-contract, failed or still under review. It requires all of the following:

- current state is `PREVIEW` and evidence uses the V3 contract;
- a terminal, provenance-complete Generator V3 result;
- completed policy/manual review when required, with reviewer and timestamp;
- explicit named human launch approval;
- complete catalog counts with full relevance and media coverage;
- grounded content with unverified claims ruled out;
- verified compliance pages/disclosures and no unresolved flags;
- verified hostname ownership, DNS, TLS and canonical configuration;
- verified checkout, payment, order routing, fulfillment, shipping, returns and tax decision.

A planned domain is not domain evidence. A mock/test checkout is not commerce evidence. The current action intentionally supplies neither verified domain nor commerce evidence, and compliance/content review remains incomplete, so new V3 stores fail closed. Existing `LIVE` stores are treated as no-transition and are not automatically downgraded.

## Local foundation versus production/live state

Implemented locally:

- versioned intent, ontology, query, evaluation, policy, result and run contracts;
- hard class-first relevance and contextual risk/media fixes;
- bounded provider search policy and auditable attempts;
- inactive DRAFT staging, run replay protection, exact-budget and stable-dedupe behavior;
- candidate publication policy and non-LIVE legacy quarantine;
- honest admin states and evidence panels;
- grounded-content sequencing, noindex controls and polished truth-bound landing presentation;
- pure comprehensive go-live gate;
- adapter-driven atomic pipeline reference and deterministic fake-adapter scenarios.

Not established by this local slice:

- a deployed production build or applied external database migration/backfill;
- a production implementation of the atomic pipeline persistence/media adapters;
- resumable recovery of an interrupted non-terminal Prisma run;
- an approved human-review write workflow and complete compliance/product dossiers;
- a real supplier canary proving media rights, inventory, landed shipping, returns and order reconciliation;
- verified production domain/DNS/TLS/canonical evidence;
- Stripe approval, live payment, order routing, supplier ordering, fulfillment, refunds or returns;
- advertising, SEO indexing, portfolio capital allocation or autonomous launch.

No operator should label a generated store production-ready from `previewReady`, a green admin result or a successful local mock checkout.

## Validation gates

These commands are release gates, not results asserted by this document. Run them against the final integrated diff and record exact pass/fail evidence:

```bash
pnpm run generator:test
pnpm run relevance:test
pnpm run commerce:test
pnpm run portfolio:audit:test
pnpm run typecheck
pnpm run lint
dotenv -e .env.local -o -- pnpm run build
git diff --check
git status --short
git ls-files --others --exclude-standard
```

The render gate must also exercise `http://localhost:3010/s/fluffy-slippers`: homepage, category, search, quiz/featured and direct relevant/off-niche product routes. Confirm relevant slippers or an honest insufficient state, no known junk in visible UI or response payload, noindex behavior, blocked live checkout and clearly marked non-persistent TEST checkout where enabled. A browser claim requires captured browser/render evidence; database counts alone do not satisfy it.

## Prioritized next slice

1. **Productionize the pipeline boundary:** implement tenant-scoped Prisma and durable-media adapters for `generator-pipeline.v1`, an atomic database commit/outbox boundary, cleanup retries and disposable-database fault-injection tests. Route the admin action through it instead of maintaining two orchestration paths.
2. **Build the evidence review lane:** persist candidate decisions, operator corrections, manual policy approval and named human launch approval as append-only audit events. Do not make generated settings JSON the approval mechanism.
3. **Run one controlled external PREVIEW canary:** one approved provider, one low-blast-radius niche, noindex, no live checkout, fixed budget and explicit cleanup. Verify supplier facts, stored-media provenance and tenant isolation without modifying legacy stores.
4. **Add product/compliance dossiers and freshness:** media rights, safety/claims sources, stock/price/shipping freshness, drift invalidation and re-review. Only then connect domain and commerce evidence to the live gate.

Advertising and mass portfolio expansion remain later slices. They should consume proven catalog and commerce evidence rather than create pressure to weaken it.
