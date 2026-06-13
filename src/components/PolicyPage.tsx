import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import { buildMetadata } from "@/lib/seo/metadata";
import { requireStore } from "@/lib/stores/queries";

/**
 * Shared renderer for the four policy pages. Policy text lives on the Store
 * record so every tenant publishes its own legally distinct copy; the
 * shipping page additionally renders the structured dropshipping disclosure
 * required by the platform's compliance rules.
 */

export type PolicyKind = "shipping" | "returns" | "privacy" | "terms";

const POLICY_TITLES: Record<PolicyKind, string> = {
  shipping: "Shipping policy",
  returns: "Returns policy",
  privacy: "Privacy policy",
  terms: "Terms of sale",
};

export async function buildPolicyMetadata(
  storeSlug: string,
  kind: PolicyKind
): Promise<Metadata> {
  const store = await requireStore(storeSlug);
  return buildMetadata({
    store,
    title: `${POLICY_TITLES[kind]} | ${store.name}`,
    description: `${POLICY_TITLES[kind]} for ${store.name}.`,
    path: `/policies/${kind}`,
  });
}

export async function PolicyPage({
  storeSlug,
  kind,
}: {
  storeSlug: string;
  kind: PolicyKind;
}) {
  const store = await requireStore(storeSlug);

  let body: string;
  switch (kind) {
    case "shipping":
      body = [
        store.shippingOriginDisclosure,
        `Typical delivery time is ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days after order confirmation. Each product page shows the exact estimate for that item. You receive a tracking link by email as soon as the carrier scans your parcel.`,
        `Orders are fulfilled by third-party supplier partners; ${store.name} remains your contract partner and your single point of contact for any issue with delivery.`,
        `Depending on your country, import taxes or customs duties may apply on delivery and are not included in our prices unless explicitly stated at checkout.`,
        `If a parcel is significantly delayed beyond the stated window, contact ${store.supportEmail} and we will investigate with the carrier, and re-ship or refund where appropriate.`,
      ].join("\n\n");
      break;
    case "returns":
      body = [
        store.returnPolicySummary,
        `To start a return, email ${store.supportEmail} with your order reference. We reply with the return address and instructions within one business day. Because fulfillment is via supplier partners, the return address may be different from our business address — never return a parcel without instructions.`,
        `Refunds are issued to the original payment method within 14 days of the returned item passing inspection. Items must be unused and in original packaging unless the return is due to a defect or our error.`,
        `Products marked "final sale" on their product page are not returnable; this is always disclosed before purchase.`,
      ].join("\n\n");
      break;
    case "privacy":
      body = store.privacyPolicy;
      break;
    case "terms":
      body = store.termsOfSale;
      break;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageViewTracker storeSlug={store.slug} />
      <Breadcrumbs
        items={[{ name: "Home", href: "/" }, { name: POLICY_TITLES[kind] }]}
      />
      <h1 className="mt-4 text-3xl font-bold text-ink">{POLICY_TITLES[kind]}</h1>
      <p className="mt-2 text-sm text-ink/50">
        {store.legalName} · Contact: {store.supportEmail}
        {store.supportPhone ? ` · ${store.supportPhone}` : ""}
      </p>
      <div className="mt-6 space-y-4 text-base leading-7 text-ink/80">
        {body.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
