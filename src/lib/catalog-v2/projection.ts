import {
  STOREFRONT_PRODUCT_V2,
  ProductRevisionV2Schema,
  StorefrontProductV2Schema,
  isImmediatelyPurchasableV2,
  type AttributeDefinitionV2,
  type AttributeValueV2,
  type ProductRevisionV2,
  type StorefrontAttributeV2,
  type StorefrontMediaV2,
  type StorefrontProductV2,
} from "./contracts";

export type StorefrontProjectionRefusalReasonV2 =
  | "INVALID_PRODUCT_REVISION"
  | "REVISION_NOT_PUBLISHED"
  | "MISSING_PUBLIC_PRIMARY_MEDIA"
  | "INVALID_STOREFRONT_PROJECTION";

export type StorefrontProjectionResultV2 =
  | {
      status: "PROJECTED";
      product: StorefrontProductV2;
      reasonCodes: [];
    }
  | {
      status: "REFUSED";
      product: null;
      reasonCodes: StorefrontProjectionRefusalReasonV2[];
    };

function comparePositionAndId(
  left: { position: number },
  right: { position: number },
  leftId: string,
  rightId: string
): number {
  if (left.position !== right.position) return left.position - right.position;
  return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
}

function publicAttribute(
  value: AttributeValueV2,
  definition: AttributeDefinitionV2
): StorefrontAttributeV2 {
  const values = value.values as Array<string | number | boolean>;
  return {
    key: definition.key,
    label: definition.label,
    value:
      definition.cardinality === "SINGLE"
        ? values[0]
        : [...values],
    unitCode: definition.unitCode,
    facetable: definition.facetable,
    comparable: definition.comparable,
  } as StorefrontAttributeV2;
}

function publicAttributes(
  values: AttributeValueV2[],
  definitions: Map<string, AttributeDefinitionV2>
): StorefrontAttributeV2[] {
  return values
    .flatMap((value) => {
      const definition = definitions.get(value.attributeDefinitionId);
      return definition?.storefrontVisible
        ? [{ value, definition }]
        : [];
    })
    .sort((left, right) =>
      comparePositionAndId(
        left.definition,
        right.definition,
        left.definition.key,
        right.definition.key
      )
    )
    .map(({ value, definition }) => publicAttribute(value, definition));
}

function publicMedia(revision: ProductRevisionV2): StorefrontMediaV2[] {
  return revision.media
    .flatMap((media) => {
      if (
        media.publicationState !== "PUBLIC_READY" ||
        media.rights.state !== "VERIFIED" ||
        !media.publicUrl ||
        media.kind === "UNKNOWN" ||
        media.role === "UNKNOWN"
      ) {
        return [];
      }
      return [
        {
          mediaId: media.mediaId,
          kind: media.kind,
          role: media.role,
          publicUrl: media.publicUrl,
          ...(media.width !== null && media.height !== null
            ? { width: media.width, height: media.height }
            : {}),
          altText: media.altText,
          focalPoint: media.focalPoint,
          variantIds: [...media.variantIds],
          position: media.position,
        } satisfies StorefrontMediaV2,
      ];
    })
    .sort((left, right) =>
      comparePositionAndId(left, right, left.mediaId, right.mediaId)
    );
}

/**
 * Explicit public whitelist. Supplier routing, source observations, costs,
 * evidence records, internal media state, and provider identifiers cannot
 * enter the returned shape because they are never copied.
 */
export function projectStorefrontProductV2(
  input: unknown
): StorefrontProjectionResultV2 {
  const parsedRevision = ProductRevisionV2Schema.safeParse(input);
  if (!parsedRevision.success) {
    return {
      status: "REFUSED",
      product: null,
      reasonCodes: ["INVALID_PRODUCT_REVISION"],
    };
  }

  const revision = parsedRevision.data;
  if (revision.revisionState !== "PUBLISHED") {
    return {
      status: "REFUSED",
      product: null,
      reasonCodes: ["REVISION_NOT_PUBLISHED"],
    };
  }

  const media = publicMedia(revision);
  if (!media.some((asset) => asset.role === "PRIMARY")) {
    return {
      status: "REFUSED",
      product: null,
      reasonCodes: ["MISSING_PUBLIC_PRIMARY_MEDIA"],
    };
  }
  const publicMediaIds = new Set(media.map((asset) => asset.mediaId));
  const definitions = new Map(
    revision.attributeDefinitions.map((definition) => [
      definition.attributeDefinitionId,
      definition,
    ])
  );

  const variants = [...revision.variants]
    .sort((left, right) =>
      comparePositionAndId(left, right, left.variantId, right.variantId)
    )
    .map((variant) => ({
      variantId: variant.variantId,
      label: variant.label,
      attributes: publicAttributes(variant.attributeValues, definitions),
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      availability: variant.availability,
      mediaIds: variant.mediaIds.filter((mediaId) => publicMediaIds.has(mediaId)),
    }));
  const purchaseOptions = [...revision.purchaseOptions]
    .sort((left, right) =>
      comparePositionAndId(
        left,
        right,
        left.purchaseOptionId,
        right.purchaseOptionId
      )
    )
    .map((option) => ({
      purchaseOptionId: option.purchaseOptionId,
      kind: option.kind,
      label: option.label,
      quantity: option.quantity,
      variantId: option.variantId,
      price: option.price,
      compareAtPrice: option.compareAtPrice,
      availability: option.availability,
      repeatPurchase: option.repeatPurchase,
    }));
  const purchasable =
    isImmediatelyPurchasableV2(revision.availability) &&
    revision.price.state === "KNOWN" &&
    (variants.length === 0 ||
      variants.some((variant) =>
        isImmediatelyPurchasableV2(variant.availability) &&
        variant.price?.state !== "UNKNOWN"
      )) &&
    (purchaseOptions.length === 0 ||
      purchaseOptions.some((option) =>
        isImmediatelyPurchasableV2(option.availability) &&
        option.kind !== "UNKNOWN" &&
        option.price.state === "KNOWN"
      ));

  const projected = StorefrontProductV2Schema.safeParse({
    version: STOREFRONT_PRODUCT_V2,
    productId: revision.productId,
    revisionId: revision.revisionId,
    slug: revision.slug,
    taxonomyNodeIds: [...revision.taxonomyNodeIds],
    title: revision.title,
    subtitle: revision.subtitle,
    description: revision.description,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    brand: revision.brand,
    price: revision.price,
    compareAtPrice: revision.compareAtPrice,
    availability: revision.availability,
    attributes: publicAttributes(revision.attributeValues, definitions),
    variants,
    purchaseOptions,
    media,
    collections: [...revision.collectionMemberships]
      .sort((left, right) =>
        comparePositionAndId(
          left,
          right,
          left.collectionId,
          right.collectionId
        )
      )
      .map((membership) => ({
        collectionId: membership.collectionId,
        position: membership.position,
      })),
    purchasable,
  });

  if (!projected.success) {
    return {
      status: "REFUSED",
      product: null,
      reasonCodes: ["INVALID_STOREFRONT_PROJECTION"],
    };
  }

  return {
    status: "PROJECTED",
    product: projected.data,
    reasonCodes: [],
  };
}
