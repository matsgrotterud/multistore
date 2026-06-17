"use client";

import { useState } from "react";

export interface ProductGalleryMediaItem {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  alt: string;
  thumbnailUrl?: string | null;
}

/**
 * Product image gallery. The seed catalog ships one hero image per product;
 * additional angle shots slot into the same component when real supplier
 * imagery is connected.
 */
export function ProductGallery({
  images,
  media,
  alt,
}: {
  images?: string[];
  media?: ProductGalleryMediaItem[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mediaItems =
    media && media.length > 0
      ? media
      : (images ?? []).map((url) => ({ url, mediaType: "IMAGE" as const, alt }));
  const safeItems =
    mediaItems.length > 0
      ? mediaItems
      : [{ url: "/api/placeholder?label=No%20image", mediaType: "IMAGE" as const, alt }];
  const active = safeItems[Math.min(activeIndex, safeItems.length - 1)];

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-theme-lg border border-ink/10 bg-ink/5">
        {active.mediaType === "VIDEO" ? (
          <video
            src={active.url}
            controls
            playsInline
            className="h-full w-full bg-black object-contain"
            aria-label={active.alt || alt}
          />
        ) : (
          <img src={active.url} alt={active.alt || alt} className="h-full w-full object-cover" />
        )}
      </div>
      {safeItems.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Product media">
          {safeItems.map((item, index) => (
            <button
              key={`${item.mediaType}-${item.url}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show ${item.mediaType.toLowerCase()} ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-theme border-2 ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              {item.mediaType === "VIDEO" ? (
                item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-ink text-[10px] font-semibold uppercase tracking-wide text-white">
                    Video
                  </span>
                )
              ) : (
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
