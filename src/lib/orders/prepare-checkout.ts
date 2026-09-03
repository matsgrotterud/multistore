import { prisma } from "@/lib/db";
import { calculateGrossMargin } from "@/lib/monetization/margin";
import { round2 } from "@/lib/pricing/calculate-price";
import { calculateCheckoutShipping } from "@/lib/orders/shipping";
import type {
  CheckoutCustomerInput,
  PreparedCheckout,
} from "@/lib/orders/types";
import {
  evaluateCheckoutCommerceEligibility,
  parseFulfillmentModeStrict,
} from "@/lib/orders/checkout-eligibility";
import { parseStoreSettings } from "@/lib/settings/store-settings";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import { checkoutSchema } from "@/lib/validation/schemas";
import { parseJsonObject } from "@/lib/utils/json";
import { decideCatalogVisibilityV3 } from "@/lib/stores/catalog-visibility-v3";
import { isSellableLiveStock } from "@/lib/catalog/stock-status";
import {
  configuredCatalogFreshnessMaxAgeHours,
  evaluateCatalogFreshness,
} from "@/lib/catalog/catalog-freshness";

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function manualFulfillmentEnabled(): boolean {
  return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
}

export interface PrepareCheckoutOptions {
  /** MOCK validates the customer experience but never requires or calls a supplier. */
  mode?: "LIVE" | "MOCK";
}

export async function prepareCheckout(
  input: unknown,
  options: PrepareCheckoutOptions = {}
): Promise<
  | { ok: true; checkout: PreparedCheckout }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;
  const mode = options.mode ?? "LIVE";
  const freshnessNow = new Date();
  const freshnessMaxAgeHours = configuredCatalogFreshnessMaxAgeHours();
  const store = await prisma.store.findUnique({
    where: { slug: data.storeSlug },
    include: { settings: true, supplierSettings: true },
  });
  if (!store) return { ok: false, message: "Unknown store." };
  if (!store.isActive) return { ok: false, message: "This store is not active." };
  if (mode === "LIVE" && store.launchStatus !== "LIVE") {
    return { ok: false, message: "This store is not open for live checkout." };
  }
  const storeSettings = parseStoreSettings(store.settings?.settings);

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      id: { in: data.items.map((item) => item.productId) },
      isPublished: true,
    },
    include: {
      variants: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const lines = [];
  let subtotal = 0;
  for (const item of data.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return { ok: false, message: "An item in your cart is no longer available." };
    }
    if (product.currency.toUpperCase() !== store.currency.toUpperCase()) {
      return {
        ok: false,
        message: `"${product.title}" is not configured in this store's checkout currency.`,
      };
    }
    const catalogVisibility = decideCatalogVisibilityV3(store, product);
    if (!catalogVisibility.visible) {
      return {
        ok: false,
        message: `"${product.title}" has not cleared this store's catalog visibility checks.`,
      };
    }
    if (product.stockStatus === "OUT_OF_STOCK") {
      return { ok: false, message: `"${product.title}" is currently out of stock.` };
    }
    if (mode === "LIVE" && !isSellableLiveStock(product.stockStatus)) {
      return {
        ok: false,
        message: `"${product.title}" does not have verified sellable inventory.`,
      };
    }
    const catalogFreshness = evaluateCatalogFreshness({
      mode,
      lastSupplierSyncAt: product.lastSupplierSyncAt,
      supplierDataJson: product.supplierDataJson,
      maxAgeHours: freshnessMaxAgeHours,
      now: freshnessNow,
    });
    if (!catalogFreshness.allowed) {
      return {
        ok: false,
        message: `"${product.title}" needs refreshed supplier and catalog evidence before live checkout.`,
      };
    }

    const selectedVariant = item.variantId
      ? product.variants.find((variant) => variant.id === item.variantId)
      : null;
    if (product.variants.length > 0 && !selectedVariant) {
      return { ok: false, message: `Please choose an option for "${product.title}".` };
    }
    if (item.variantId && !selectedVariant) {
      return { ok: false, message: `Selected option for "${product.title}" is no longer available.` };
    }
    if (selectedVariant?.stockStatus === "OUT_OF_STOCK") {
      return {
        ok: false,
        message: `"${product.title}" (${selectedVariant.optionSummary}) is currently out of stock.`,
      };
    }
    if (
      mode === "LIVE" &&
      selectedVariant &&
      !isSellableLiveStock(selectedVariant.stockStatus)
    ) {
      return {
        ok: false,
        message: `The selected option for "${product.title}" does not have verified sellable inventory.`,
      };
    }

    const fulfillmentMode = parseFulfillmentModeStrict(product.fulfillmentMode);
    if (!fulfillmentMode) {
      return {
        ok: false,
        message: `"${product.title}" has an unsupported fulfillment configuration.`,
      };
    }
    if (fulfillmentMode === "AFFILIATE") {
      return {
        ok: false,
        message: `"${product.title}" is sold via an external partner link — use View deal on the product page.`,
      };
    }
    if (mode === "LIVE" && fulfillmentMode === "MOCK") {
      return {
        ok: false,
        message: `"${product.title}" is a test product and cannot be purchased through live checkout.`,
      };
    }
    if (
      mode === "LIVE" &&
      fulfillmentMode === "MANUAL" &&
      !manualFulfillmentEnabled()
    ) {
      return {
        ok: false,
        message: `"${product.title}" is not available for checkout at this time.`,
      };
    }
    const unitPrice = selectedVariant?.price ?? product.price;
    const unitCost = selectedVariant?.cost ?? product.cost;
    const unitSupplierShippingCost =
      selectedVariant?.shippingCost ?? product.shippingCost;
    if (
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !Number.isFinite(unitCost) ||
      unitCost < 0 ||
      !Number.isFinite(unitSupplierShippingCost) ||
      unitSupplierShippingCost < 0
    ) {
      return {
        ok: false,
        message: `"${product.title}" has invalid price or supplier cost data.`,
      };
    }
    const contributionMargin = calculateGrossMargin({
      price: unitPrice,
      cost: unitCost,
      shippingCost: unitSupplierShippingCost,
    });
    const commerceEligibility = evaluateCheckoutCommerceEligibility({
      mode,
      store: {
        isActive: store.isActive,
        launchStatus: store.launchStatus,
        generation: storeSettings.generation,
      },
      product: {
        isPublished: product.isPublished,
        catalogVisible: catalogVisibility.visible,
        mediaStatus: product.mediaStatus,
        qualityStatus: product.qualityStatus,
        supplierDataJson: product.supplierDataJson,
      },
      contributionMarginPercent: contributionMargin.grossMarginPercent,
      minimumContributionMarginPercent:
        storeSettings.monetization.minMarginPercent,
    });
    if (!commerceEligibility.allowed) {
      const belowMargin = commerceEligibility.reasonCodes.includes(
        "CONTRIBUTION_MARGIN_BELOW_FLOOR"
      );
      return {
        ok: false,
        message: belowMargin
          ? `"${product.title}" is below this store's minimum contribution margin and cannot be purchased.`
          : `"${product.title}" has not cleared live-commerce eligibility checks.`,
      };
    }

    if (mode === "LIVE" && fulfillmentMode === "DROPSHIP") {
      if (!product.externalId) {
        return {
          ok: false,
          message: `"${product.title}" is missing supplier fulfillment data.`,
        };
      }

      const providerKey = product.providerKey;
      if (!providerKey) {
        return {
          ok: false,
          message: `"${product.title}" is missing its fulfillment provider.`,
        };
      }
      const supplierSetting = store.supplierSettings.find(
        (candidate) => candidate.providerKey === providerKey
      );
      if (
        !supplierSetting?.isEnabled ||
        supplierSetting.fulfillmentMode !== "DROPSHIP"
      ) {
        return {
          ok: false,
          message: `"${product.title}" is not enabled for this store's fulfillment route.`,
        };
      }
      let provider;
      try {
        provider = getCommerceProvider(providerKey);
      } catch {
        return {
          ok: false,
          message: `"${product.title}" uses an unknown fulfillment provider.`,
        };
      }

      if (!provider.capabilities.checkout || !provider.createDropshipOrder) {
        return {
          ok: false,
          message: `"${product.title}" cannot be sold through checkout until ${provider.name} checkout is enabled.`,
        };
      }

      if (
        selectedVariant &&
        !selectedVariant.externalVariantId &&
        !selectedVariant.sku
      ) {
        return {
          ok: false,
          message: `"${product.title}" is missing supplier variant data for checkout.`,
        };
      }
    }

    const sku = selectedVariant?.sku ?? product.sku;
    subtotal += unitPrice * item.quantity;
    lines.push({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      title: product.title,
      slug: product.slug,
      sku,
      variantTitle: selectedVariant?.title ?? null,
      optionSummary: selectedVariant?.optionSummary ?? null,
      externalVariantId: selectedVariant?.externalVariantId ?? null,
      variantSnapshot: selectedVariant
        ? {
            id: selectedVariant.id,
            title: selectedVariant.title,
            optionSummary: selectedVariant.optionSummary,
            options: parseJsonObject(selectedVariant.optionsJson),
            sku: selectedVariant.sku,
            externalVariantId: selectedVariant.externalVariantId,
            imageUrl: selectedVariant.imageUrl,
          }
        : {},
      quantity: item.quantity,
      unitPrice,
      unitCost,
      fulfillmentMode,
      providerKey: product.providerKey,
      externalId: product.externalId,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
      countryOfOrigin: product.countryOfOrigin,
    });
  }

  if (mode === "LIVE") {
    const fulfillmentRoutes = new Set(
      lines.map((line) => `${line.fulfillmentMode}:${line.providerKey ?? "none"}`)
    );
    if (fulfillmentRoutes.size > 1) {
      return {
        ok: false,
        message:
          "These items cannot yet be combined safely in one order. Please check out items from one fulfillment route at a time.",
      };
    }
  }

  subtotal = round2(subtotal);
  const shippingTotal = calculateCheckoutShipping(subtotal);
  const grandTotal = round2(subtotal + shippingTotal);

  const customer: CheckoutCustomerInput = {
    name: data.name,
    email: data.email,
    addressLine1: data.addressLine1,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country,
  };

  return {
    ok: true,
    checkout: {
      checkoutAttemptId: data.checkoutAttemptId,
      storeId: store.id,
      storeSlug: store.slug,
      currency: store.currency,
      subtotal,
      shippingTotal,
      grandTotal,
      orderNumber: generateOrderNumber(),
      customer,
      lines,
    },
  };
}
