"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProductImageAction,
  deleteProductImageAction,
  moveProductImageAction,
  setPrimaryProductImageAction,
  updateProductImageAltAction,
} from "@/lib/actions/admin-image";

export interface ProductImageManagerProps {
  storeSlug: string;
  productId: string;
  images: Array<{
    id: string;
    url: string;
    alt: string;
    sortOrder: number;
    isPrimary: boolean;
  }>;
}

export function ProductImageManager({ storeSlug, productId, images }: ProductImageManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      router.refresh();
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        body.set("storeSlug", storeSlug);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) {
          setError(data.error ?? "Upload failed.");
          continue;
        }
        const result = await addProductImageAction({
          productId,
          storeSlug,
          url: data.url,
          alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        });
        if (!result.ok) setError(result.error ?? "Could not attach image.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    }
  }

  const busy = isPending || isUploading;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Images</h2>
          <p className="mt-1 text-sm text-slate-500">
            The primary image is mirrored to the product card, structured data and
            the Merchant feed. PNG, JPEG, WebP, GIF or AVIF up to 5 MB.
          </p>
        </div>
        <label className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {isUploading ? "Uploading…" : "Upload images"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No uploaded images yet. The storefront falls back to the current image
          URL / placeholder until you add one.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-20 w-20 shrink-0 rounded-md border border-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {image.isPrimary ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() => setPrimaryProductImageAction({ imageId: image.id, storeSlug }))
                        }
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Set primary
                      </button>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Move up"
                        disabled={busy || index === 0}
                        onClick={() =>
                          run(() => moveProductImageAction({ imageId: image.id, storeSlug, direction: "up" }))
                        }
                        className="rounded px-1.5 py-0.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        disabled={busy || index === images.length - 1}
                        onClick={() =>
                          run(() => moveProductImageAction({ imageId: image.id, storeSlug, direction: "down" }))
                        }
                        className="rounded px-1.5 py-0.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() => deleteProductImageAction({ imageId: image.id, storeSlug }))
                        }
                        className="rounded px-1.5 py-0.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <input
                    defaultValue={image.alt}
                    placeholder="Alt text (SEO + accessibility)"
                    disabled={busy}
                    onBlur={(event) => {
                      if (event.target.value !== image.alt) {
                        run(() =>
                          updateProductImageAltAction({
                            imageId: image.id,
                            storeSlug,
                            alt: event.target.value,
                          })
                        );
                      }
                    }}
                    className="mt-2 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
