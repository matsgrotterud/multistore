export const STORE_GROWTH_ADVISOR_VERSION = "store-growth-advisor.v1" as const;
export const STORE_GROWTH_WINDOW_DAYS = 28 as const;
export const STORE_GROWTH_MIN_CONSENTED_SESSIONS = 100 as const;
export const STORE_GROWTH_MIN_PRODUCT_VIEWS = 50 as const;
export const PORTFOLIO_GROWTH_PRIORITY_VERSION =
  "portfolio-growth-priority.v1" as const;

export type StoreGrowthStage =
  | "NOT_LIVE"
  | "INSUFFICIENT_EVIDENCE"
  | "ZERO_SALES"
  | "TRACTION";

export type StoreGrowthFunnelDiagnosis =
  | "NOT_APPLICABLE"
  | "STORE_DISCOVERY"
  | "PRODUCT_OFFER"
  | "CART_FRICTION"
  | "CHECKOUT_FRICTION";

export type StoreGrowthEvidenceTrust =
  | "VERIFIED_COMMERCE"
  | "CONSENTED_ADVISORY";

export type StoreGrowthMarginStatus = "POSITIVE" | "NON_POSITIVE" | "UNKNOWN";
export type StoreGrowthCatalogFreshness = "FRESH" | "STALE" | "UNKNOWN";

export type StoreGrowthScaleBlocker =
  | "STORE_NOT_LIVE"
  | "NO_CAPTURED_SALES"
  | "MARGIN_UNKNOWN"
  | "MARGIN_NON_POSITIVE"
  | "CATALOG_STALE"
  | "CATALOG_FRESHNESS_UNKNOWN"
  | "FULFILLMENT_BLOCKED";

export type StoreGrowthActionCode =
  | "COMPLETE_LAUNCH_GATES"
  | "VERIFY_CONSENTED_MEASUREMENT"
  | "INCREASE_QUALIFIED_DISCOVERY"
  | "IMPROVE_STORE_DISCOVERY"
  | "IMPROVE_PRODUCT_OFFER"
  | "REDUCE_CART_FRICTION"
  | "INVESTIGATE_CHECKOUT"
  | "VERIFY_MARGIN_DATA"
  | "RESTORE_POSITIVE_MARGIN"
  | "REFRESH_CATALOG_EVIDENCE"
  | "RESOLVE_FULFILLMENT_BLOCKERS"
  | "REVIEW_BOUNDED_MARKETING_TEST"
  | "HOLD_MARKETING_SPEND";

export type StoreGrowthActionArea =
  | "LAUNCH"
  | "MEASUREMENT"
  | "DISCOVERY"
  | "PRODUCT"
  | "CART"
  | "CHECKOUT"
  | "CATALOG"
  | "MARGIN"
  | "FULFILLMENT"
  | "MARKETING";

export interface StoreGrowthEventInput {
  eventName: string;
  sessionId: string;
  payload: string;
  createdAt: Date | string;
}

export interface StoreGrowthOrderInput {
  id: string;
  paymentStatus: string;
  paymentProvider: string | null;
  stripePaymentIntentId: string | null;
  status: string;
  fulfillmentStatus: string;
  grandTotal: number;
  taxTotal: number;
  createdAt: Date | string;
  items: Array<{
    quantity: number;
    unitPrice: number;
    unitCost: number | null;
  }>;
  supplierOrders: Array<{ status: string }>;
}

export interface StoreGrowthCatalogProductInput {
  productId: string;
  freshness: StoreGrowthCatalogFreshness;
}

export interface BuildStoreGrowthPlanInput {
  now: Date;
  store: {
    id: string;
    slug: string;
    name: string;
    currency: string;
    launchStatus: string;
    isActive: boolean;
  };
  events: readonly StoreGrowthEventInput[];
  orders: readonly StoreGrowthOrderInput[];
  catalogProducts: readonly StoreGrowthCatalogProductInput[];
}

export interface StoreGrowthTelemetryMetrics {
  consentedSessions: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  beginCheckouts: number;
  clientCheckoutSuccesses: number;
  malformedEvents: number;
}

export interface StoreGrowthCommerceMetrics {
  capturedOrders: number;
  capturedRevenue: number;
  knownItemRevenue: number | null;
  knownItemCost: number | null;
  contributionProxy: number | null;
  marginStatus: StoreGrowthMarginStatus;
  fulfillmentBlockerOrders: number;
}

export interface StoreGrowthEvidence {
  key: string;
  trust: StoreGrowthEvidenceTrust;
  value: string | number | boolean;
  detail: string;
}

export interface StoreGrowthRecommendation {
  code: StoreGrowthActionCode;
  area: StoreGrowthActionArea;
  priority: "P0" | "P1" | "P2";
  title: string;
  hypothesis: string;
  targetMetric: string;
  minimumEvidence: string;
  evidenceRefs: string[];
  marketingOrSpend: boolean;
  requiresHumanApproval: boolean;
}

export interface StoreGrowthPlan {
  version: typeof STORE_GROWTH_ADVISOR_VERSION;
  store: {
    id: string;
    slug: string;
    name: string;
    currency: string;
    launchStatus: string;
  };
  window: {
    days: typeof STORE_GROWTH_WINDOW_DAYS;
    start: string;
    end: string;
  };
  stage: StoreGrowthStage;
  funnelDiagnosis: StoreGrowthFunnelDiagnosis;
  telemetry: StoreGrowthTelemetryMetrics;
  commerce: StoreGrowthCommerceMetrics;
  catalogFreshness: StoreGrowthCatalogFreshness;
  scaleEligibility: {
    eligible: boolean;
    blockers: StoreGrowthScaleBlocker[];
  };
  evidence: StoreGrowthEvidence[];
  recommendations: StoreGrowthRecommendation[];
  limitations: string[];
}

export type PortfolioGrowthLane =
  | "INCIDENT"
  | "SCALE_REVIEW"
  | "OPTIMIZE"
  | "MEASURE"
  | "LAUNCH_BLOCKED";

export type PortfolioGrowthReasonCode =
  | "FULFILLMENT_INCIDENT"
  | "NON_POSITIVE_MARGIN_INCIDENT"
  | "NONLIVE_CAPTURED_COMMERCE_INCIDENT"
  | "CHECKOUT_EVIDENCE_INCIDENT"
  | "VERIFIED_SCALE_REVIEW_ELIGIBLE"
  | "TRACTION_EVIDENCE_BLOCKED"
  | "ZERO_SALES_FUNNEL"
  | "INSUFFICIENT_MEASUREMENT"
  | "STORE_NOT_LIVE";

export interface PortfolioGrowthQueueItem {
  rank: number;
  lane: PortfolioGrowthLane;
  reasonCode: PortfolioGrowthReasonCode;
  reason: string;
  plan: StoreGrowthPlan;
  nextRecommendation: StoreGrowthRecommendation | null;
  evidenceTrust: StoreGrowthEvidenceTrust[];
  humanReviewRequired: true;
}

export interface PortfolioGrowthQueueSummary {
  totalStores: number;
  incidents: number;
  scaleReviews: number;
  optimizationReviews: number;
  measurementReviews: number;
  launchBlocked: number;
}

export interface PortfolioGrowthQueue {
  version: typeof PORTFOLIO_GROWTH_PRIORITY_VERSION;
  items: PortfolioGrowthQueueItem[];
  summary: PortfolioGrowthQueueSummary;
  limitations: string[];
}
