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
        `The currently recorded supplier estimate is ${store.defaultShippingDaysMin}–${store.defaultShippingDaysMax} business days. Each product page shows the estimate available for that item; it is not a delivery guarantee.`,
        `Orders may be fulfilled by third-party supplier partners. Contact ${store.supportEmail} if you need help with an order.`,
        `Depending on your country and the checkout terms, import taxes or customs duties may apply. Review the amount and disclosures shown before payment.`,
        `Tracking information is provided only when it is made available by the fulfillment partner or carrier.`,
      ].join("\n\n");
      break;
    case "returns":
      body = [
        store.returnPolicySummary,
        `To request a return, email ${store.supportEmail} with your order reference and wait for the return address and instructions. A supplier return address may differ from the business address.`,
        `Eligibility, condition requirements, timing and refund handling follow the return summary and terms published for this store. Contact support before sending anything back.`,
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
