"use client";

import { useActionState } from "react";
import { updateProductAction } from "@/lib/actions/admin-product";
import type { AdminActionState } from "@/lib/actions/admin-store";
import {
  CheckboxField,
  FormSection,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/admin/fields";
import { STOCK_STATUSES, STOCK_STATUS_LABELS } from "@/lib/types";

const STOCK_OPTIONS = STOCK_STATUSES.map((value) => ({
  value,
  label: STOCK_STATUS_LABELS[value],
}));

const initialState: AdminActionState = { ok: false, error: null };

export interface ProductEditFormProps {
  storeSlug: string;
  productId: string;
  categories: Array<{ id: string; name: string }>;
  suppliers: string[];
  product: {
    categoryId: string;
    title: string;
    subtitle: string;
    description: string;
    shortDescription: string;
    brand: string;
    sku: string;
    gtin: string | null;
    imageUrl: string;
    imageAlt: string;
    price: number;
    compareAtPrice: number | null;
    cost: number;
    shippingCost: number;
    stockStatus: string;
    supplierName: string;
    supplierProductId: string;
    shippingDaysMin: number;
    shippingDaysMax: number;
    countryOfOrigin: string | null;
    materials: string | null;
    warranty: string | null;
    returnable: boolean;
    seoTitle: string;
    seoDescription: string;
    canonicalUrl: string | null;
    isPublished: boolean;
    noindex: boolean;
    pros: string;
    cons: string;
    useCases: string;
    specs: string;
    faq: string;
  };
}

export function ProductEditForm({
  storeSlug,
  productId,
  categories,
  suppliers,
  product,
}: ProductEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateProductAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="storeSlug" value={storeSlug} />

      <FormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="title" label="Title" defaultValue={product.title} required />
          <SelectField
            name="categoryId"
            label="Category"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            defaultValue={product.categoryId}
          />
          <TextField name="subtitle" label="Subtitle" defaultValue={product.subtitle} />
          <TextField name="brand" label="Brand" defaultValue={product.brand} required />
          <TextField name="sku" label="SKU" defaultValue={product.sku} required />
          <TextField name="gtin" label="GTIN" defaultValue={product.gtin} hint="Optional barcode for Merchant feed." />
        </div>
        <TextareaField name="shortDescription" label="Short description" defaultValue={product.shortDescription} rows={2} hint="Max 300 chars; used in cards and meta." />
        <TextareaField name="description" label="Full description" defaultValue={product.description} rows={6} />
      </FormSection>

      <FormSection title="Media" description="Upload and order gallery images above. These fields mirror the primary image and update automatically — edit them only to point at an external URL.">
        <TextField name="imageUrl" label="Primary image URL" defaultValue={product.imageUrl} required hint="Auto-set to the primary uploaded image; override for an external/CDN URL." />
        <TextField name="imageAlt" label="Primary image alt text" defaultValue={product.imageAlt} hint="Describe the image for SEO and accessibility." />
      </FormSection>

      <FormSection title="Pricing" description="Margin and product score are recomputed on save from price, cost and shipping.">
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberField name="price" label="Price" defaultValue={product.price} min={0} step={0.01} />
          <NumberField name="compareAtPrice" label="Compare-at price" defaultValue={product.compareAtPrice} min={0} step={0.01} hint="Only shown if honest." />
          <NumberField name="cost" label="Supplier cost" defaultValue={product.cost} min={0} step={0.01} />
          <NumberField name="shippingCost" label="Shipping cost" defaultValue={product.shippingCost} min={0} step={0.01} />
        </div>
      </FormSection>

      <FormSection title="Supply & fulfillment">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="supplierName" label="Supplier name" defaultValue={product.supplierName} hint="Matched to the Supplier table for reliability scoring." />
          <TextField name="supplierProductId" label="Supplier product ID" defaultValue={product.supplierProductId} />
          <SelectField name="stockStatus" label="Stock status" options={STOCK_OPTIONS} defaultValue={product.stockStatus} />
          <TextField name="countryOfOrigin" label="Country of origin" defaultValue={product.countryOfOrigin} />
          <NumberField name="shippingDaysMin" label="Shipping days (min)" defaultValue={product.shippingDaysMin} min={1} />
          <NumberField name="shippingDaysMax" label="Shipping days (max)" defaultValue={product.shippingDaysMax} min={1} />
          <TextField name="materials" label="Materials" defaultValue={product.materials} />
          <TextField name="warranty" label="Warranty" defaultValue={product.warranty} />
        </div>
        <CheckboxField name="returnable" label="Returnable" defaultChecked={product.returnable} />
        {suppliers.length > 0 && (
          <p className="text-xs text-slate-500">Known suppliers: {suppliers.join(", ")}</p>
        )}
      </FormSection>

      <FormSection title="Selling points" description="Honest pros and cons score higher than one-sided copy.">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextareaField name="pros" label="Pros" defaultValue={product.pros} rows={5} hint="One per line." />
          <TextareaField name="cons" label="Cons" defaultValue={product.cons} rows={5} hint="One per line." />
        </div>
        <TextareaField name="useCases" label="Use cases" defaultValue={product.useCases} rows={3} hint="One tag per line. Drives quiz + recommendations." />
        <TextareaField name="specs" label="Specs" defaultValue={product.specs} rows={5} hint="One per line as: Label | Value" />
        <TextareaField name="faq" label="FAQ" defaultValue={product.faq} rows={5} hint="One per line as: Question | Answer" />
      </FormSection>

      <FormSection title="SEO & publishing">
        <TextField name="seoTitle" label="SEO title" defaultValue={product.seoTitle} required />
        <TextareaField name="seoDescription" label="SEO description" defaultValue={product.seoDescription} rows={2} />
        <TextField name="canonicalUrl" label="Canonical URL" defaultValue={product.canonicalUrl} hint="Defaults to the primary domain product URL." />
        <div className="grid gap-1 sm:grid-cols-2">
          <CheckboxField name="isPublished" label="Published" defaultChecked={product.isPublished} hint="Unpublished products are hidden from the storefront." />
          <CheckboxField name="noindex" label="No-index" defaultChecked={product.noindex} hint="Keep live but exclude from search engines." />
        </div>
      </FormSection>

      <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save product"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}
