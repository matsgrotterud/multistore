"use client";

import { useState } from "react";

/**
 * Product image gallery. The seed catalog ships one hero image per product;
 * additional angle shots slot into the same component when real supplier
 * imagery is connected.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length > 0 ? images : ["/api/placeholder?label=No%20image"];
  const active = safeImages[Math.min(activeIndex, safeImages.length - 1)];

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-theme-lg border border-ink/10 bg-ink/5">
        <img src={active} alt={alt} className="h-full w-full object-cover" />
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Product images">
          {safeImages.map((image, index) => (
            <button
              key={image}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 overflow-hidden rounded-theme border-2 ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
