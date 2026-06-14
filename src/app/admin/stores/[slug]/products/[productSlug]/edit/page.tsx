import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/auth";
import { parseFaq, parseSpecs, parseStringArray } from "@/lib/utils/json";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";

export const dynamic = "force-dynamic";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  await requireAdmin();
  const { slug, productSlug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

  const product = await prisma.product.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: productSlug } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  const specsText = parseSpecs(product.specs)
    .map((spec) => `${spec.label} | ${spec.value}`)
    .join("\n");
  const faqText = parseFaq(product.faq)
    .map((item) => `${item.question} | ${item.answer}`)
    .join("\n");

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link href="/admin/stores" className="hover:underline">
          Stores
        </Link>{" "}
        /{" "}
        <Link href={`/admin/stores/${store.slug}/products`} className="hover:underline">
          {store.name}
        </Link>{" "}
        / <span className="text-slate-900">{product.title}</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Edit product</h1>
        <Link
          href={`/s/${store.slug}/p/${product.slug}`}
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          View on storefront
        </Link>
      </div>

      <div className="mb-6">
        <ProductImageManager
          storeSlug={store.slug}
          productId={product.id}
          images={product.images.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          }))}
        />
      </div>

      <ProductEditForm
        storeSlug={store.slug}
        productId={product.id}
        categories={categories}
        suppliers={suppliers.map((supplier) => supplier.name)}
        product={{
          categoryId: product.categoryId,
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          shortDescription: product.shortDescription,
          brand: product.brand,
          sku: product.sku,
          gtin: product.gtin,
          imageUrl: product.imageUrl,
          imageAlt: product.imageAlt,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          cost: product.cost,
          shippingCost: product.shippingCost,
          stockStatus: product.stockStatus,
          supplierName: product.supplierName,
          supplierProductId: product.supplierProductId,
          shippingDaysMin: product.shippingDaysMin,
          shippingDaysMax: product.shippingDaysMax,
          countryOfOrigin: product.countryOfOrigin,
          materials: product.materials,
          warranty: product.warranty,
          returnable: product.returnable,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          canonicalUrl: product.canonicalUrl,
          isPublished: product.isPublished,
          noindex: product.noindex,
          pros: parseStringArray(product.pros).join("\n"),
          cons: parseStringArray(product.cons).join("\n"),
          useCases: parseStringArray(product.useCases).join("\n"),
          specs: specsText,
          faq: faqText,
        }}
      />
    </div>
  );
}
