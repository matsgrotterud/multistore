import { Fragment, type ReactNode } from "react";
import {
  visibleStorefrontSections,
  type StorefrontPresentationV1,
  type StorefrontSectionId,
} from "@/lib/storefront/presentation";

export function StorefrontSections({
  presentation,
  sections,
  footer,
}: {
  presentation: StorefrontPresentationV1;
  sections: Partial<Record<StorefrontSectionId, ReactNode>> & {
    "featured-products": ReactNode;
  };
  footer: ReactNode;
}) {
  return (
    <div className="storefront-sections mx-auto max-w-site space-y-20 px-4 py-14 sm:px-6 sm:py-20 lg:space-y-28">
      {visibleStorefrontSections(presentation).map((sectionId) => {
        const section = sections[sectionId];
        if (!section) return null;
        return (
          <Fragment key={sectionId}>
            <div data-storefront-section={sectionId}>{section}</div>
          </Fragment>
        );
      })}
      <div data-storefront-section="policy">{footer}</div>
    </div>
  );
}

