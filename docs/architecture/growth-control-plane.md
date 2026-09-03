# Growth Control Plane

Status: implemented local read-only foundation; not an attribution, advertising,
profitability or production-readiness attestation.

`portfolio-growth-priority.v1` turns each store's deterministic 28-day growth
plan into one stable operating queue:

1. incidents;
2. bounded scale reviews;
3. optimization hypotheses;
4. measurement work;
5. launch-blocked stores.

Only a persisted Stripe `CAPTURED` order with an intent identifier can establish
traction. Client `CartEvent` rows remain consented advisory telemetry and can
never promote a store into scale review. Fulfillment blockers and non-positive
known item contribution override traction and launch state. Captured commerce
on a non-LIVE tenant is an incident, never a growth signal.

The queue performs no writes, provider calls, AI calls, domain changes or
marketing spend. It does not compare revenue across currencies. Every item is a
human review task, and any marketing recommendation remains bounded by an owner,
budget cap, attribution plan and stop condition.

The current `Experiment` table has no assignment ledger or safe order
attribution. Until those contracts exist, the control plane does not claim A/B
winners, incremental lift or ROAS.
