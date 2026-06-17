import { prisma } from "@/lib/db";
import { placeOrder } from "@/lib/actions/checkout";

/**
 * One-off Phase 1 proof: runs the real mock checkout pipeline (prepareCheckout →
 * persistOrder → routeOrder) for a CJ product with a variant, then prints the
 * resulting order + SupplierOrder so manual-fulfillment routing can be verified.
 */
async function main() {
  const storeSlug = process.argv[2] ?? "children-vegan-toys";
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) throw new Error(`Store ${storeSlug} not found`);

  const product = await prisma.product.findFirst({
    where: {
      storeId: store.id,
      providerKey: "cj",
      isPublished: true,
      variants: { some: { stockStatus: "IN_STOCK" } },
    },
    include: { variants: { where: { stockStatus: "IN_STOCK" }, take: 1 } },
  });
  if (!product) throw new Error("No CJ product with an in-stock variant found");

  const variant = product.variants[0];
  console.log(
    `Checking out: ${product.slug} (variant ${variant.optionSummary || variant.id})`
  );

  const result = await placeOrder({
    storeSlug: store.slug,
    name: "Phase One Tester",
    email: "phase1@example.com",
    addressLine1: "Storgata 1",
    city: "Oslo",
    postalCode: "0151",
    country: "Norway",
    items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
  });

  console.log("\nplaceOrder result:", JSON.stringify(result, null, 2));
  if (!result.ok || !result.orderId) throw new Error("Checkout failed");

  const order = await prisma.order.findUnique({
    where: { id: result.orderId },
    include: { items: true, supplierOrders: true },
  });

  console.log("\nORDER SNAPSHOT");
  console.log(`  orderNumber=${order?.orderNumber}`);
  console.log(`  status=${order?.status} payment=${order?.paymentStatus} fulfillment=${order?.fulfillmentStatus}`);
  console.log(`  grandTotal=${order?.grandTotal} ${order?.currency}`);
  for (const item of order?.items ?? []) {
    console.log(
      `  item: ${item.titleSnapshot} | variant=${item.optionSummarySnapshot ?? "-"} | qty=${item.quantity} | unit=${item.unitPrice} | sku=${item.skuSnapshot} | externalVariantId=${item.externalVariantId ?? "-"}`
    );
  }
  for (const supplier of order?.supplierOrders ?? []) {
    console.log(
      `  supplierOrder: provider=${supplier.providerKey} status=${supplier.status} externalRef=${supplier.externalOrderId ?? "(none — not placed)"}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
