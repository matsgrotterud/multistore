import { z } from "zod";
import { digestCatalogValue } from "./canonical";
import {
  AvailabilityV2Schema,
  DigestV2Schema,
  RetailPriceV2Schema,
  type RetailPriceV2,
} from "./contracts";
import {
  LegacyProductLikeV2Schema,
  adaptLegacyProductLikeToV2,
} from "./legacy-adapter";

export const V1_V2_SHADOW_INPUT_V2 = "catalog-v1-v2-shadow-input.v2" as const;
export const V1_V2_SHADOW_REPORT_V2 = "catalog-v1-v2-shadow-report.v2" as const;
export const SHADOW_COMPARISON_MAX_PRODUCTS_V2 = 25 as const;

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const ShadowPublicFactsV2Schema = z
  .object({
    identity: z
      .object({
        slug: slugSchema,
        title: z.string().trim().min(1).max(240),
      })
      .strict(),
    price: RetailPriceV2Schema,
    availability: AvailabilityV2Schema,
    purchasable: z.boolean(),
  })
  .strict();

export const VerifiedPublicMediaInputV2Schema = z
  .object({
    state: z.literal("VERIFIED"),
    sourceKind: z.literal("MERCHANT_OWNED"),
    publicUrl: z.string().url(),
    attestationRef: idSchema,
    verifiedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const ShadowComparisonItemInputV2Schema = z
  .object({
    legacyProduct: LegacyProductLikeV2Schema,
    v1PublicFacts: ShadowPublicFactsV2Schema,
    verifiedPublicMedia: VerifiedPublicMediaInputV2Schema,
  })
  .strict();

export const ShadowComparisonInputV2Schema = z
  .object({
    contractVersion: z.literal(V1_V2_SHADOW_INPUT_V2),
    runAt: z.string().datetime({ offset: true }),
    items: z
      .array(ShadowComparisonItemInputV2Schema)
      .min(1)
      .max(SHADOW_COMPARISON_MAX_PRODUCTS_V2),
  })
  .strict()
  .superRefine((input, ctx) => {
    const slugs = new Set<string>();
    input.items.forEach((item, index) => {
      if (slugs.has(item.v1PublicFacts.identity.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "v1PublicFacts", "identity", "slug"],
          message: "Shadow comparison identities must be unique",
        });
      }
      slugs.add(item.v1PublicFacts.identity.slug);
      if (
        Date.parse(item.verifiedPublicMedia.verifiedAt) > Date.parse(input.runAt)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "verifiedPublicMedia", "verifiedAt"],
          message: "Media verification cannot be newer than the shadow run",
        });
      }
    });
  });

export type ShadowPublicFactsV2 = z.infer<typeof ShadowPublicFactsV2Schema>;
export type VerifiedPublicMediaInputV2 = z.infer<
  typeof VerifiedPublicMediaInputV2Schema
>;
export type ShadowComparisonItemInputV2 = z.infer<
  typeof ShadowComparisonItemInputV2Schema
>;
export type ShadowComparisonInputV2 = z.infer<
  typeof ShadowComparisonInputV2Schema
>;

const shadowFactStateSchema = z.enum(["PASS", "FAIL", "REFUSED"]);

export const ShadowFactComparisonV2Schema = z
  .object({
    state: shadowFactStateSchema,
    expectedDigest: DigestV2Schema,
    actualDigest: DigestV2Schema.nullable(),
  })
  .strict()
  .superRefine((fact, ctx) => {
    if (fact.state === "REFUSED" && fact.actualDigest !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actualDigest"],
        message: "Refused facts cannot assert an actual digest",
      });
    }
    if (fact.state !== "REFUSED" && fact.actualDigest === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actualDigest"],
        message: "Compared facts require an actual digest",
      });
    }
    if (
      fact.state === "PASS" &&
      fact.actualDigest !== fact.expectedDigest
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "Passing facts require equal digests",
      });
    }
    if (
      fact.state === "FAIL" &&
      fact.actualDigest === fact.expectedDigest
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "Failing facts require different digests",
      });
    }
  });

const shadowSafeFactsSchema = z
  .object({
    price: RetailPriceV2Schema,
    availability: AvailabilityV2Schema,
    purchasable: z.boolean(),
  })
  .strict();

export const ShadowComparisonItemReportV2Schema = z
  .object({
    itemRef: z.string().regex(/^shadow-item:sha256:[a-f0-9]{64}$/),
    state: shadowFactStateSchema,
    facts: z
      .object({
        identity: ShadowFactComparisonV2Schema,
        price: ShadowFactComparisonV2Schema,
        availability: ShadowFactComparisonV2Schema,
        purchasability: ShadowFactComparisonV2Schema,
      })
      .strict(),
    expected: shadowSafeFactsSchema,
    actual: shadowSafeFactsSchema.nullable(),
    expectedPublicFactsDigest: DigestV2Schema,
    actualPublicFactsDigest: DigestV2Schema.nullable(),
    reasonCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
  })
  .strict()
  .superRefine((item, ctx) => {
    const factStates = Object.values(item.facts).map((fact) => fact.state);
    const expectedState = factStates.includes("REFUSED")
      ? "REFUSED"
      : factStates.includes("FAIL")
        ? "FAIL"
        : "PASS";
    if (item.state !== expectedState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["state"],
        message: "Item state must summarize its fact states",
      });
    }
    if (item.state === "REFUSED") {
      if (item.actual !== null || item.actualPublicFactsDigest !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual"],
          message: "Refused items cannot assert actual public facts",
        });
      }
    } else if (item.actual === null || item.actualPublicFactsDigest === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actual"],
        message: "Compared items require actual public facts",
      });
    }
  });

const shadowReportContentSchema = z
  .object({
    contractVersion: z.literal(V1_V2_SHADOW_REPORT_V2),
    runAt: z.string().datetime({ offset: true }),
    mode: z.literal("READ_ONLY"),
    activationAllowed: z.literal(false),
    mutationCount: z.literal(0),
    status: shadowFactStateSchema,
    itemCount: z.number().int().min(1).max(SHADOW_COMPARISON_MAX_PRODUCTS_V2),
    passCount: z.number().int().nonnegative(),
    failCount: z.number().int().nonnegative(),
    refusedCount: z.number().int().nonnegative(),
    v1CatalogDigest: DigestV2Schema,
    v2CatalogDigest: DigestV2Schema,
    items: z
      .array(ShadowComparisonItemReportV2Schema)
      .min(1)
      .max(SHADOW_COMPARISON_MAX_PRODUCTS_V2),
    reasonCodes: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)),
  })
  .strict();

type ShadowReportContentV2 = z.infer<typeof shadowReportContentSchema>;

export const ShadowComparisonReportV2Schema = shadowReportContentSchema
  .extend({ reportDigest: DigestV2Schema })
  .strict()
  .superRefine((report, ctx) => {
    const passCount = report.items.filter((item) => item.state === "PASS").length;
    const failCount = report.items.filter((item) => item.state === "FAIL").length;
    const refusedCount = report.items.filter(
      (item) => item.state === "REFUSED"
    ).length;
    if (
      report.itemCount !== report.items.length ||
      report.passCount !== passCount ||
      report.failCount !== failCount ||
      report.refusedCount !== refusedCount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["itemCount"],
        message: "Shadow report counts must match its items",
      });
    }
    const expectedStatus = refusedCount > 0 ? "REFUSED" : failCount > 0 ? "FAIL" : "PASS";
    if (report.status !== expectedStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Shadow report status must summarize its items",
      });
    }
    const refs = report.items.map((item) => item.itemRef);
    if (
      new Set(refs).size !== refs.length ||
      refs.some((itemRef, index) => index > 0 && refs[index - 1]! > itemRef)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Shadow report items must be unique and sorted by ref",
      });
    }
    const content: ShadowReportContentV2 = {
      contractVersion: report.contractVersion,
      runAt: report.runAt,
      mode: report.mode,
      activationAllowed: report.activationAllowed,
      mutationCount: report.mutationCount,
      status: report.status,
      itemCount: report.itemCount,
      passCount: report.passCount,
      failCount: report.failCount,
      refusedCount: report.refusedCount,
      v1CatalogDigest: report.v1CatalogDigest,
      v2CatalogDigest: report.v2CatalogDigest,
      items: report.items,
      reasonCodes: report.reasonCodes,
    };
    if (report.reportDigest !== digestCatalogValue(content)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reportDigest"],
        message: "Shadow report digest must match its canonical content",
      });
    }
  });

export type ShadowFactComparisonV2 = z.infer<
  typeof ShadowFactComparisonV2Schema
>;
export type ShadowComparisonItemReportV2 = z.infer<
  typeof ShadowComparisonItemReportV2Schema
>;
export type ShadowComparisonReportV2 = z.infer<
  typeof ShadowComparisonReportV2Schema
>;

export type ShadowComparisonExecutionV2 =
  | {
      status: "PASS" | "FAIL" | "REFUSED";
      report: ShadowComparisonReportV2;
      refusalDigest: null;
      reasonCodes: string[];
    }
  | {
      status: "REFUSED";
      report: null;
      refusalDigest: `sha256:${string}`;
      reasonCodes: ["INVALID_SHADOW_INPUT"];
    };

function factComparison(
  expected: unknown,
  actual: unknown
): ShadowFactComparisonV2 {
  const expectedDigest = digestCatalogValue(expected);
  const actualDigest = digestCatalogValue(actual);
  return {
    state: expectedDigest === actualDigest ? "PASS" : "FAIL",
    expectedDigest,
    actualDigest,
  };
}

function refusedFact(expected: unknown): ShadowFactComparisonV2 {
  return {
    state: "REFUSED",
    expectedDigest: digestCatalogValue(expected),
    actualDigest: null,
  };
}

function safeFacts(facts: ShadowPublicFactsV2) {
  return {
    price: facts.price,
    availability: facts.availability,
    purchasable: facts.purchasable,
  };
}

function refusedItem(
  expected: ShadowPublicFactsV2,
  reasonCode: "LEGACY_ADAPTER_REFUSED" | "STOREFRONT_PROJECTION_REFUSED"
): ShadowComparisonItemReportV2 {
  return {
    itemRef: `shadow-item:${digestCatalogValue(expected.identity)}`,
    state: "REFUSED",
    facts: {
      identity: refusedFact(expected.identity),
      price: refusedFact(expected.price),
      availability: refusedFact(expected.availability),
      purchasability: refusedFact(expected.purchasable),
    },
    expected: safeFacts(expected),
    actual: null,
    expectedPublicFactsDigest: digestCatalogValue(expected),
    actualPublicFactsDigest: null,
    reasonCodes: [reasonCode],
  };
}

function compareItem(
  item: ShadowComparisonItemInputV2,
  runAt: string
): ShadowComparisonItemReportV2 {
  const adapted = adaptLegacyProductLikeToV2(item.legacyProduct, {
    adaptedAt: runAt,
    publicImageUrl: item.verifiedPublicMedia.publicUrl,
    publicImageRightsVerified: true,
  });
  if (adapted.status !== "ADAPTED") {
    return refusedItem(item.v1PublicFacts, "LEGACY_ADAPTER_REFUSED");
  }
  if (adapted.storefrontProjection.status !== "PROJECTED") {
    return refusedItem(item.v1PublicFacts, "STOREFRONT_PROJECTION_REFUSED");
  }

  const product = adapted.storefrontProjection.product;
  const actual: ShadowPublicFactsV2 = {
    identity: { slug: product.slug, title: product.title },
    price: product.price,
    availability: product.availability,
    purchasable: product.purchasable,
  };
  const facts = {
    identity: factComparison(item.v1PublicFacts.identity, actual.identity),
    price: factComparison(item.v1PublicFacts.price, actual.price),
    availability: factComparison(
      item.v1PublicFacts.availability,
      actual.availability
    ),
    purchasability: factComparison(
      item.v1PublicFacts.purchasable,
      actual.purchasable
    ),
  };
  const state = Object.values(facts).some((fact) => fact.state === "FAIL")
    ? "FAIL"
    : "PASS";
  return ShadowComparisonItemReportV2Schema.parse({
    itemRef: `shadow-item:${digestCatalogValue(item.v1PublicFacts.identity)}`,
    state,
    facts,
    expected: safeFacts(item.v1PublicFacts),
    actual: safeFacts(actual),
    expectedPublicFactsDigest: digestCatalogValue(item.v1PublicFacts),
    actualPublicFactsDigest: digestCatalogValue(actual),
    reasonCodes: state === "FAIL" ? ["PUBLIC_FACT_MISMATCH"] : [],
  });
}

function invalidInputDigest(error: z.ZodError): `sha256:${string}` {
  const safeIssues = error.issues
    .map((issue) => ({
      code: issue.code,
      path: issue.path.map(String),
      message: issue.message,
    }))
    .sort((left, right) => {
      const leftPath = left.path.join(".");
      const rightPath = right.path.join(".");
      return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0;
    });
  return digestCatalogValue({ reasonCode: "INVALID_SHADOW_INPUT", issues: safeIssues });
}

/**
 * Pure shadow proof only: no writes, activation hooks, provider calls, or raw
 * legacy fields enter the returned report.
 */
export function compareLegacyCatalogShadowV2(
  input: unknown
): ShadowComparisonExecutionV2 {
  const parsed = ShadowComparisonInputV2Schema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "REFUSED",
      report: null,
      refusalDigest: invalidInputDigest(parsed.error),
      reasonCodes: ["INVALID_SHADOW_INPUT"],
    };
  }

  const items = parsed.data.items
    .map((item) => compareItem(item, parsed.data.runAt))
    .sort((left, right) => left.itemRef.localeCompare(right.itemRef));
  const passCount = items.filter((item) => item.state === "PASS").length;
  const failCount = items.filter((item) => item.state === "FAIL").length;
  const refusedCount = items.filter((item) => item.state === "REFUSED").length;
  const status = refusedCount > 0 ? "REFUSED" : failCount > 0 ? "FAIL" : "PASS";
  const reasonCodes =
    status === "REFUSED"
      ? ["SHADOW_ITEM_REFUSED"]
      : status === "FAIL"
        ? ["PUBLIC_FACT_MISMATCH"]
        : [];
  const content: ShadowReportContentV2 = {
    contractVersion: V1_V2_SHADOW_REPORT_V2,
    runAt: parsed.data.runAt,
    mode: "READ_ONLY",
    activationAllowed: false,
    mutationCount: 0,
    status,
    itemCount: items.length,
    passCount,
    failCount,
    refusedCount,
    v1CatalogDigest: digestCatalogValue(
      items.map((item) => ({
        itemRef: item.itemRef,
        digest: item.expectedPublicFactsDigest,
      }))
    ),
    v2CatalogDigest: digestCatalogValue(
      items.map((item) => ({
        itemRef: item.itemRef,
        digest: item.actualPublicFactsDigest,
      }))
    ),
    items,
    reasonCodes,
  };
  const report = ShadowComparisonReportV2Schema.parse({
    ...content,
    reportDigest: digestCatalogValue(content),
  });
  return { status, report, refusalDigest: null, reasonCodes };
}

export function retailPriceFromMinorUnitsV2(
  amountMinor: number | null,
  currency: string | null
): RetailPriceV2 {
  if (
    amountMinor === null ||
    currency === null ||
    !Number.isSafeInteger(amountMinor) ||
    amountMinor < 0 ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return { state: "UNKNOWN", money: null };
  }
  return {
    state: "KNOWN",
    money: { version: "catalog-money.v2", currency, amountMinor },
  };
}
