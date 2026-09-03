# Provider-independent Store Operating System

Status: implemented as a local, fail-closed preparation layer. It is not a
catalog, launch, legal, domain, analytics-attribution or profitability
attestation.

## Purpose

Multistore can prepare a differentiated store before a supplier or product is
selected. `foundation-store-plan.v1` turns a niche, audience and brand voice
into an inactive store DRAFT containing:

- a versioned brand and positioning foundation;
- an explicit storefront presentation and contrast-checked theme;
- homepage and SEO content briefs that remain `DRAFT_NOINDEX`;
- provisional policy copy that clearly says commerce is disabled;
- a planned hostname recorded as intent, not routing authority.

The foundation-only path creates no `Category`, `Product`, supplier settings,
catalog run, provider request or `Domain` row. It sets `isActive=false` and
`launchStatus=DRAFT`, so the generic storefront resolver cannot expose it.
Creation is bound to a durable request key stored with the foundation. A
transaction-scoped database lock makes a lost-response retry return the same
store and serializes human slug allocation. The generic settings form also
forces every `DRAFT` inactive and leaves `Domain` rows untouched.

## Admin control surfaces

- **Store factory** creates the inactive foundation draft. The existing
  provider-backed generator remains collapsed and separate for later work.
- **Foundation Studio** proposes, previews and audits a deterministic,
  digest-bound foundation. Saving it never mutates catalog or commerce data.
- **Content Studio** inventories and edits store-scoped content. Server-side
  policy forces unsafe, thin, duplicate, unrouted or non-LIVE material into an
  unpublished and/or noindex state. Per-store content writes are serialized in
  the database so two concurrent requests cannot publish duplicate FAQ or
  comparison singletons. LIVE storefront consumers honor persisted noindex:
  comparison metadata stays noindex and noindexed FAQ fragments/JSON-LD are
  suppressed from an otherwise indexable homepage.
- **Readiness** evaluates foundation, brand, design, content, SEO, legal,
  consent, domain, measurement and experimentation evidence. It can return
  `READY_FOR_REVIEW`, but `launchAuthorized` is always false.
- **Growth Queue** is a read-only portfolio triage surface. Only captured
  commerce evidence can establish traction; client events remain advisory.

## Consent and measurement boundary

Optional analytics stays off until the current versioned consent contract is
accepted. A visitor can reopen preferences and withdraw consent. The tracking
client does not create a session identifier before consent. In production, the
tracking endpoint binds the claimed store to the resolved live hostname and
rejects mismatches. Every event is bound to both the consent schema version and
the privacy-policy version; either mismatch is rejected.

`CartEvent` is still unauthenticated client telemetry. It is therefore useful
for advisory diagnostics only and cannot establish sales, attribution,
experiment lift or a scale decision.

## Explicitly deferred

The following require separate, evidence-backed workflows and are not inferred
from a completed foundation:

- product selection, pricing, stock, delivery and supplier capability;
- legal approval and an authenticated reviewer identity;
- domain purchase, ownership, DNS, TLS and canonical verification;
- checkout, payments, fulfillment and returns operations;
- experiment assignment, order attribution, ROAS and autonomous ad spend;
- LIVE activation or search indexing.

Until those controls exist, preparation remains reversible, admin-only and
noindex.
