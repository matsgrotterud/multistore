import type { StockStatus } from "../../src/lib/types";

/** Shapes for the per-store seed modules. Validated with Zod in seed.ts. */

export interface SeedSpec {
  label: string;
  value: string;
}

export interface SeedFaq {
  question: string;
  answer: string;
}

export interface SeedProductInput {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  brand: string;
  sku: string;
  gtin?: string | null;
  price: number;
  compareAtPrice?: number | null;
  cost: number;
  shippingCost: number;
  stockStatus: StockStatus;
  supplierName: string;
  supplierProductId: string;
  /** Marketplace used for daily image sync cron. */
  supplierSource?: "aliexpress" | "temu" | "ebay" | "wish" | "alibaba";
  /** Direct listing URL when known. */
  supplierUrl?: string;
  /** Search query for finding the best-matching supplier listing. */
  supplierSearchQuery?: string;
  shippingDaysMin: number;
  shippingDaysMax: number;
  countryOfOrigin?: string | null;
  materials?: string | null;
  warranty?: string | null;
  returnable: boolean;
  pros: string[];
  cons: string[];
  specs: SeedSpec[];
  useCases: string[];
  faq: SeedFaq[];
  seoTitle: string;
  seoDescription: string;
}

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  sortOrder: number;
  products: SeedProductInput[];
}

export interface SeedGuide {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  relatedProductSlugs: string[];
}

export interface SeedComparison {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  productSlugs: string[];
}

export interface SeedStoreInfo {
  slug: string;
  name: string;
  legalName: string;
  primaryDomain: string;
  locale: string;
  currency: string;
  niche: string;
  positioning: string;
  audience: string;
  valueProposition: string;
  brandVoice: string;
  logoText: string;
  supportEmail: string;
  supportPhone?: string | null;
  shippingOriginDisclosure: string;
  defaultShippingDaysMin: number;
  defaultShippingDaysMax: number;
  returnPolicySummary: string;
}

export interface SeedTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontHeading: string;
  fontBody: string;
}

export interface SeedStore {
  store: SeedStoreInfo;
  theme: SeedTheme;
  domains: string[];
  categories: SeedCategory[];
  guides: SeedGuide[];
  comparison: SeedComparison;
  homepageFaq: SeedFaq[];
}

/**
 * Shared policy text generators so each store ships complete, store-specific
 * legal copy. Replace with lawyer-reviewed text per market before launch.
 */
export function defaultPrivacyPolicy(info: SeedStoreInfo): string {
  return [
    `${info.legalName} ("we") operates ${info.name} at ${info.primaryDomain}. This policy explains what personal data we process and why.`,
    `We process the data you provide when ordering (name, email, delivery address) to fulfill your purchase, including sharing the delivery address with the supplier partner and carrier that ship your order. We process your email for order updates, and for newsletters only if you explicitly subscribe.`,
    `With your consent we collect anonymous analytics events (pages viewed, items added to cart) to improve the store. Necessary cookies for cart and checkout are always active; analytics and marketing cookies are opt-in and can be declined with one click.`,
    `We never sell personal data. Data is retained only as long as needed for orders, accounting law, or until you ask us to delete it. You can request access, correction or deletion of your data at any time by emailing ${info.supportEmail}.`,
  ].join("\n\n");
}

export function defaultTermsOfSale(info: SeedStoreInfo): string {
  return [
    `These terms govern purchases from ${info.name}, operated by ${info.legalName}. By placing an order you accept these terms.`,
    `Prices are shown in ${info.currency} and include the product price only; shipping is shown at checkout. Depending on your country, import taxes or customs duties may be charged on delivery and are your responsibility unless stated otherwise at checkout.`,
    `Orders are fulfilled by third-party supplier partners. Typical delivery is ${info.defaultShippingDaysMin}–${info.defaultShippingDaysMax} business days; the estimate on each product page applies to that item. ${info.name} remains your contract partner: if anything goes wrong with delivery or the product, contact ${info.supportEmail} and we will resolve it.`,
    `${info.returnPolicySummary} Statutory warranty rights in your country remain unaffected by these terms.`,
    `If an item arrives damaged or defective, contact us within 14 days with photos and we will replace or refund it at no cost to you.`,
  ].join("\n\n");
}
