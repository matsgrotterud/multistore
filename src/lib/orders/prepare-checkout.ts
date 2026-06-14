import { prisma } from "@/lib/db";
import { MARGIN_SAFE_THRESHOLD, calculateGrossMargin } from "@/lib/monetization/margin";
import { round2 } from "@/lib/pricing/calculate-price";
import type {
  CheckoutCustomerInput,
  FulfillmentMode,
  PreparedCheckout,
} from "@/lib/orders/types";
import { getCommerceProvider } from "@/lib/suppliers/providers/registry";
import { checkoutSchema } from "@/lib/validation/schemas";

function shippingCostFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= 50 ? 0 : 5.95;
}

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function parseFulfillmentMode(value: string): FulfillmentMode {
  if (value === "DROPSHIP" || value === "AFFILIATE" || value === "MANUAL" || value === "MOCK") {
    return value;
  }
  return "MANUAL";
}

function manualFulfillmentEnabled(): boolean {
  return process.env.MANUAL_FULFILLMENT_ENABLED === "true";
}

export async function prepareCheckout(input: unknown): Promise<
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
  const store = await prisma.store.findUnique({ where: { slug: data.storeSlug } });
  if (!store) return { ok: false, message: "Unknown store." };

  const products = await prisma.product.findMany({
    where: {
      storeId: store.id,
      id: { in: data.items.map((item) => item.productId) },
      isPublished: true,
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
    if (product.stockStatus === "OUT_OF_STOCK") {
      return { ok: false, message: `"${product.title}" is currently out of stock.` };
    }

    const fulfillmentMode = parseFulfillmentMode(product.fulfillmentMode);
    if (fulfillmentMode === "AFFILIATE") {
      return {
        ok: false,
        message: `"${product.title}" is sold via an external partner link — use View deal on the product page.`,
      };
    }
    if (fulfillmentMode === "MANUAL" && !manualFulfillmentEnabled()) {
      return {
        ok: false,
        message: `"${product.title}" is not available for checkout at this time.`,
      };
    }
    if (fulfillmentMode === "DROPSHIP") {
      if (!product.externalId) {
        return {
          ok: false,
          message: `"${product.title}" is missing supplier fulfillment data.`,
        };
      }

      const providerKey = product.providerKey ?? "mock";
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
    }

    subtotal += product.price * item.quantity;
    lines.push({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      unitCost: product.cost,
      fulfillmentMode,
      providerKey: product.providerKey,
      externalId: product.externalId,
      shippingDaysMin: product.shippingDaysMin,
      shippingDaysMax: product.shippingDaysMax,
      countryOfOrigin: product.countryOfOrigin,
    });

    const margin = calculateGrossMargin(product);
    if (margin.grossMarginPercent < MARGIN_SAFE_THRESHOLD) {
      console.warn(
        `[margin-safe] Checkout line below ${MARGIN_SAFE_THRESHOLD}% margin: ` +
          `${store.slug}/${product.slug} at ${margin.grossMarginPercent}%`
      );
    }
  }

  subtotal = round2(subtotal);
  const shippingTotal = shippingCostFor(subtotal);
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
