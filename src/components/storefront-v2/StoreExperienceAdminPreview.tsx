import React from "react";
import Image from "next/image";
import type { StorefrontProductV2 } from "@/lib/catalog-v2/contracts";
import {
  selectReferenceStoreMediaV2,
  type ResolvedReferenceStoreMediaV2,
} from "@/lib/reference-store-media-v2";
import type { StoreExperienceCatalogProjectionV2 } from "@/lib/storefront-v2/catalog-context";
import type { StoreExperienceManifestV2 } from "@/lib/storefront-v2/manifest";
import type { StoreExperienceRenderDocumentV2 } from "@/lib/storefront-v2/render-document";
import {
  StoreExperienceRendererV2,
  type ProtectedStorefrontRenderSlotsV2,
  type StoreExperiencePageV2,
} from "./StoreExperienceRenderer";

export interface StoreExperienceAdminPreviewPropsV2 {
  /** Preferred immutable input shared by synthetic and persisted previews. */
  document?: StoreExperienceRenderDocumentV2;
  /** Compatibility inputs for isolated contract tests and legacy callers. */
  manifest?: StoreExperienceManifestV2;
  catalog?: StoreExperienceCatalogProjectionV2;
  page?: StoreExperiencePageV2;
}

function formatMoney(product: StorefrontProductV2): string {
  if (product.price.state !== "KNOWN") return "Price unavailable";

  const { currency, amountMinor } = product.price.money;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amountMinor / 100);
  } catch {
    return `${amountMinor / 100} ${currency}`;
  }
}

function ReferenceMediaImage({
  media,
  className,
  sizes,
}: {
  media: ResolvedReferenceStoreMediaV2;
  className: string;
  sizes: string;
}) {
  const objectPosition = media.focalPoint
    ? `${media.focalPoint.x * 100}% ${media.focalPoint.y * 100}%`
    : "50% 50%";
  return (
    <Image
      src={media.src}
      alt={media.altText}
      width={media.width}
      height={media.height}
      sizes={sizes}
      unoptimized
      className={className}
      style={{ objectPosition }}
      data-media-id={media.mediaId}
      data-media-role={media.role}
      data-media-rights={media.rights}
      data-media-source={media.source}
      data-media-variant-refs={media.variantIds.join(",")}
    />
  );
}

function PreviewProductCard({ product }: { product: StorefrontProductV2 }) {
  const media = selectReferenceStoreMediaV2(product);
  return (
    <article
      className="h-full min-w-0 overflow-hidden border p-3 shadow-[var(--storefront-shadow)] sm:p-4"
      style={{
        backgroundColor: "var(--storefront-color-surface)",
        borderColor: "var(--storefront-color-border)",
        borderRadius: "var(--storefront-radius)",
        color: "var(--storefront-color-text)",
      }}
    >
      <div
        className="flex aspect-[var(--storefront-product-ratio)] items-center justify-center overflow-hidden bg-black/5 text-center text-xs"
        style={{ borderRadius: "var(--storefront-radius)" }}
      >
        {media ? (
          <ReferenceMediaImage
            media={media}
            sizes="(max-width: 640px) 86vw, (max-width: 1024px) 42vw, 22vw"
            className="h-full w-full [object-fit:var(--storefront-product-fit)]"
          />
        ) : (
          <span className="p-4">Reviewed media unavailable</span>
        )}
      </div>
      {product.brand ? (
        <p
          className="mt-4 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: "var(--storefront-color-muted-text)" }}
        >
          {product.brand}
        </p>
      ) : null}
      <h3 className="mt-1 break-words text-sm font-bold">{product.title}</h3>
      <p className="mt-2 text-sm font-semibold">{formatMoney(product)}</p>
      <p
        className="mt-2 text-[10px] uppercase tracking-wide"
        style={{ color: "var(--storefront-color-muted-text)" }}
      >
        {product.availability.replaceAll("_", " ")}
      </p>
    </article>
  );
}

function previewSlots(): ProtectedStorefrontRenderSlotsV2 {
  const disabledButton = (label: string) => (
    <button
      type="button"
      disabled
      className="min-h-11 cursor-not-allowed border bg-black/5 px-4 py-2 text-xs font-semibold opacity-60"
      style={{
        borderColor: "var(--storefront-color-border)",
        borderRadius: "var(--storefront-radius)",
      }}
    >
      {label}
    </button>
  );

  return {
    commerce: {
      cart: disabledButton("Cart preview"),
      cartPage: (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-700">
          Protected cart shell preview. Cart mutations are disabled.
        </div>
      ),
      checkoutPage: (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-700">
          Protected checkout shell preview. Payment actions are disabled.
        </div>
      ),
      productCard: (product) => <PreviewProductCard product={product} />,
      productGallery: (product) => {
        const defaultVariant = product.variants[0]?.variantId ?? null;
        const media = selectReferenceStoreMediaV2(product, defaultVariant);
        return (
          <div
            className="flex aspect-[var(--storefront-gallery-ratio)] items-center justify-center overflow-hidden border bg-black/5 text-center text-sm"
            style={{
              borderColor: "var(--storefront-color-border)",
              borderRadius: "var(--storefront-radius)",
            }}
          >
            {media ? (
              <ReferenceMediaImage
                media={media}
                sizes="(max-width: 768px) 92vw, 48vw"
                className="h-full w-full [object-fit:var(--storefront-gallery-fit)]"
              />
            ) : (
              <span className="p-8">Reviewed media unavailable</span>
            )}
          </div>
        );
      },
      purchasePanel: (product) => (
        <div
          className="border p-5 shadow-[var(--storefront-shadow)]"
          style={{
            backgroundColor: "var(--storefront-color-surface)",
            borderColor: "var(--storefront-color-border)",
            borderRadius: "var(--storefront-radius)",
            color: "var(--storefront-color-text)",
          }}
        >
          <p className="text-xl font-bold">{formatMoney(product)}</p>
          <p
            className="mt-2 text-xs uppercase tracking-wide"
            style={{ color: "var(--storefront-color-muted-text)" }}
          >
            {product.availability.replaceAll("_", " ")}
          </p>
          <div className="mt-4">{disabledButton("Purchase action locked")}</div>
        </div>
      ),
      filterBar: (facets, products) => (
        <div
          className="flex min-w-0 flex-wrap items-center gap-2 border p-4 text-xs"
          style={{
            backgroundColor: "var(--storefront-color-surface)",
            borderColor: "var(--storefront-color-border)",
            borderRadius: "var(--storefront-radius)",
          }}
        >
          <span className="font-bold">{products.length} projected products</span>
          {facets.map((facet) => (
            <span
              key={facet}
              className="break-all rounded-full border px-3 py-1"
              style={{ borderColor: "var(--storefront-color-border)" }}
            >
              {facet}
            </span>
          ))}
        </div>
      ),
      wishlistControl: (_product, label) => disabledButton(`${label} preview`),
      newsletterSignup: ({ title, body, submitLabel, consentLabel }) => (
        <div>
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{body}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              aria-label="Newsletter email preview"
              disabled
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm"
            />
            {disabledButton(`${submitLabel} preview`)}
          </div>
          <p className="mt-3 text-xs text-slate-500">{consentLabel}</p>
        </div>
      ),
    },
    policy: {
      merchantIdentity: (
        <p className="text-xs text-slate-600">Platform merchant identity shell</p>
      ),
      links: (
        <p className="text-xs text-slate-600">Platform policy links shell</p>
      ),
      page: (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-700">
          Platform-owned policy content appears here.
        </div>
      ),
    },
    content: {
      article: (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-700">
          Platform-owned article content appears here.
        </div>
      ),
      faq: (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-700">
          Platform-owned FAQ content appears here.
        </div>
      ),
    },
  };
}

/** Admin-only, mutation-free rendering of the same validated public contract. */
export function StoreExperienceAdminPreviewV2({
  document,
  manifest: manifestInput,
  catalog: catalogInput,
  page = { kind: "home" },
}: StoreExperienceAdminPreviewPropsV2) {
  const manifest = document?.manifest ?? manifestInput;
  const catalog = document?.catalog ?? catalogInput;
  if (!manifest || !catalog) {
    throw new Error("Store Experience admin preview requires one complete render document.");
  }
  return (
    <section
      aria-label="Store Experience V2 admin preview"
      data-render-document-version={document?.version ?? "compatibility-input"}
      data-render-revision-id={document?.revisionId ?? "compatibility-input"}
      data-preview-activation={document?.activation.scope ?? "PREVIEW_ONLY"}
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-300 bg-slate-950 shadow-xl"
    >
      <div className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white">
        Admin preview · noindex · commerce mutations disabled
      </div>
      <div className="max-h-[900px] min-w-0 overflow-auto bg-white">
        <StoreExperienceRendererV2
          manifest={manifest}
          catalog={catalog}
          page={page}
          slots={previewSlots()}
          preview
        />
      </div>
    </section>
  );
}

export const AdminStoreExperiencePreviewV2 = StoreExperienceAdminPreviewV2;
