# Multistore commerce operating model

Status: adopted direction for implementation; not a production-readiness attestation.

## Customer contract

- One Norwegian legal seller is the merchant of record for the whole customer order.
- One storefront checkout creates one customer order, one payment and one receipt.
- Suppliers are private fulfillment vendors. They are not separate sellers in the customer flow and are not paid with Stripe Connect.
- The storefront, checkout, terms, confirmation, receipt and statement descriptor must identify the same merchant clearly.
- The merchant owns support, refunds, returns, disputes, product safety and delivery risk regardless of supplier recovery.
- A customer may receive multiple packages under the same order, but never unexpected extra charges or supplier-facing error messages.

## First production mode

The first production release is intentionally narrower than the final architecture:

1. One fulfillment provider route per checkout.
2. One server-authoritative quote and total.
3. No manual supplier fallback in unattended checkout.
4. No mixed-provider cart until idempotency, cancellation, partial failure, refunds and package tracking pass fault-injection tests.
5. Mock checkout remains explicit, non-persistent and incapable of payment, conversion tracking or supplier writes.
6. Preview and inactive stores cannot start live payment.

The eventual internal model is:

```text
CustomerOrder
  -> FulfillmentGroup[]
      -> SupplierOrder
      -> Shipment[]
          -> ShipmentItem[]
  -> PaymentLedger
  -> Refund[]
  -> Return/RMA[]
  -> Dispute[]
```

This permits several suppliers without splitting the visible checkout. Customer-facing status is derived from packages and items, while supplier identifiers and operational failures remain internal.

## Supplier admission

| Source | Decision | Required evidence |
|---|---|---|
| CJdropshipping | Pilot candidate | Exact order contract, idempotency/reconciliation, landed quote, tracking, cancellation, returns, neutral packaging and two physical test orders |
| AliExpress | Conditional | Approved AliExpress Business/dropship participation and approved ordering integration; product, media, privacy and route evidence per SKU |
| Temu | Blocked | Current Norwegian consumer terms are personal/non-commercial; reconsider only with a separate written B2B/reseller agreement and supported order API |
| Etsy | Blocked for automation | No verified buyer-order automation contract; only consider a separately contracted, manually curated producer relationship |

Marketplace scraping, consumer-account automation, credential sharing, promo-account farming and copying media without rights are prohibited implementation paths.

## Stripe account model

- The same Norwegian legal entity may operate the brands, but independently operated live websites should use accurately configured Stripe accounts grouped under one Stripe Organization.
- Do not create a Stripe account for prototypes. Create it only when a brand passes the launch gate.
- Each live account needs correct public business information, recognizable statement descriptor, support details, MCC and fulfillment disclosure.
- Obtain written Stripe confirmation for the multi-brand dropshipping model, delivery windows and planned account structure before scaling.
- Stripe Managed Payments is not the selected model for physical goods. Stripe Connect is unnecessary while suppliers are ordinary procurement vendors rather than independent customer-facing sellers.

## Customer experience for packages

Before payment, show the legal seller, final total, delivery arrangement, realistic delivery interval per item and whether the order may arrive in separate packages. After purchase, show one order page containing `Package 1 of N`, its items, ETA, carrier and tracking. One support and return entry point covers the complete order.

Supplier names, supplier order IDs, `MANUAL_ACTION_REQUIRED`, provider errors and dropshipping jargon must never appear in customer messaging.

## Hard gates before live payment

- Verified domain, TLS and fail-closed tenant routing.
- Production authentication and audit trail.
- Stripe account/business-model approval.
- Server-authoritative price, inventory, landed shipping, tax/duty and delivery quote.
- Idempotent fulfillment claim and provider order reference.
- Provider result reconciliation and cancellation.
- Refund, return, dispute, shipment and recall operations.
- Product dossier, safety/compliance evidence, claims sources and media rights.
- DDP/landed route with no surprise import charge to the customer.
- Working-capital, refund and chargeback reserves.

## Primary references

- [Stripe: multiple accounts](https://docs.stripe.com/get-started/account/multiple-accounts?locale=en-GB)
- [Stripe: merchant of record](https://docs.stripe.com/connect/merchant-of-record?locale=en-GB)
- [Stripe: marketplace model](https://docs.stripe.com/connect/marketplace)
- [AliExpress Business Program agreement](https://terms.alicdn.com/legal-agreement/terms/c_end_product_protocol/20240204100040824/20240204100040824.html)
- [Temu Norwegian terms](https://www.temu.com/no/terms-of-use.html)
- [Etsy dropshipping and reselling policy](https://help.etsy.com/hc/en-us/articles/23948763872151-Does-Etsy-Allow-Drop-Shipping-or-Reselling)
- [Norwegian Right of Withdrawal Act](https://lovdata.no/dokument/NL/lov/2014-06-20-27)

External policies and legal classifications can change. Reverify them at every launch review.
