import fs from "node:fs";
import path from "node:path";
import type { AuditEvidence } from "./types";

interface RepoEvidenceOptions {
  rootDir?: string;
  typecheckPassed?: boolean;
}

/**
 * Static, read-only inspection of capabilities that are visible in source.
 * This intentionally does not inspect secret values or make network calls.
 */
export function collectRepoEvidence(options: RepoEvidenceOptions = {}): AuditEvidence[] {
  const root = options.rootDir ?? process.cwd();
  const read = (relativePath: string): string =>
    fs.readFileSync(path.join(root, relativePath), "utf8");

  const middleware = read("src/middleware.ts");
  const edgeRouting = read("src/lib/tenant/edge-routing.ts");
  const resolver = read("src/lib/tenant/resolve-tenant.ts");
  const domainMap = read("src/config/domain-map.ts");
  const checkout = read("src/lib/orders/prepare-checkout.ts");
  const routing = read("src/lib/orders/route-order.ts");
  const stripeClient = read("src/lib/payments/stripe-client.ts");
  const mockCheckoutAction = read("src/lib/actions/checkout.ts");
  const auth = read("src/lib/admin/auth.ts");
  const ai = read("src/lib/ai/store-blueprint.ts");
  const schema = read("prisma/schema.prisma");

  const hasStaticDomainMap = /DOMAIN_MAP/.test(domainMap);
  const hasDatabaseDomainLookup = /prisma\.domain\.findUnique/.test(resolver);
  const productionUsesDatabaseDomainAuthority =
    /staticHostStore\s*=\s*isProduction\s*\?\s*null/.test(middleware) &&
    /databaseAuthority:\s*true/.test(middleware) &&
    /options\.databaseAuthority\s*\|\|\s*process\.env\.NODE_ENV\s*===\s*["']production["']/.test(
      resolver
    );
  const unknownHostFailsClosed =
    /input\.isProduction\)\s*return\s*\{\s*kind:\s*["']NOT_FOUND["']/.test(edgeRouting) &&
    /decision\.kind\s*===\s*["']NOT_FOUND["']/.test(middleware);
  const checkoutRequiresLive =
    /store\.launchStatus\s*!==\s*["']LIVE["']/.test(checkout) ||
    /launchStatus\s*:\s*["']LIVE["']/.test(checkout);
  const checkoutRequiresActive =
    /!store\.isActive/.test(checkout) || /isActive\s*:\s*true/.test(checkout);
  const mockDefaultsOff = /process\.env\.MOCK_CHECKOUT\s*===\s*["']true["']/.test(
    stripeClient
  );
  const mockCannotRouteSupplier =
    !/routeOrder/.test(mockCheckoutAction) &&
    !/persistOrderFromCheckout/.test(mockCheckoutAction) &&
    !/checkout_success/.test(mockCheckoutAction);
  const hasFulfillmentClaim =
    /idempotency/i.test(routing) && /(transaction|updateMany|lockedAt|claim)/i.test(routing);
  const singleFulfillmentRoute =
    /fulfillmentRoutes\.size\s*>\s*1/.test(checkout) &&
    !/isCjManualFulfillmentEnabled/.test(checkout);
  const hasRefundDomain = /model\s+(Refund|Return|Rma)\b/i.test(schema);
  const hasProductDossier = /model\s+(ProductMaster|ProductDossier|ComplianceDossier)\b/i.test(
    schema
  );
  const hasRecallDomain = /model\s+Recall\b/i.test(schema);
  const productionAuth =
    /model\s+(User|Membership|Role|AuditLog)\b/.test(schema) && !/changeme/.test(auth);
  const nonMockAi = !/return\s+mockAiProvider/.test(ai);

  return sortEvidence([
    fact("runtime.typecheck", options.typecheckPassed, options.typecheckPassed === undefined
      ? "Run with --typecheck-passed only after a separate successful typecheck."
      : "Supplied by the audit runner after a separate typecheck."),
    unknown("runtime.local-smoke", "Browser smoke evidence is a separate, explicit attestation."),
    fact(
      "tenant.single-domain-authority",
      !hasDatabaseDomainLookup ||
        !hasStaticDomainMap ||
        productionUsesDatabaseDomainAuthority,
      "Production must use the Domain table as its single authority; static aliases are development-only."
    ),
    fact(
      "tenant.unknown-host-fails-closed",
      unknownHostFailsClosed,
      "Production hosts must never fall through query, cookie or default-store selection."
    ),
    fact(
      "commerce.preview-checkout-blocked",
      checkoutRequiresLive && checkoutRequiresActive,
      "Authoritative checkout lookup must require an active LIVE store."
    ),
    fact(
      "commerce.mock-isolated-from-suppliers",
      mockDefaultsOff && mockCannotRouteSupplier,
      "Mock checkout must be opt-in and incapable of reaching live supplier writes."
    ),
    fact(
      "commerce.fulfillment-idempotent",
      hasFulfillmentClaim,
      "Supplier routing needs an atomic claim and an idempotency contract."
    ),
    fact(
      "commerce.single-fulfillment-route",
      singleFulfillmentRoute,
      "Mixed supplier checkout must remain blocked until the saga is proven."
    ),
    fact("commerce.refunds-operable", hasRefundDomain, "Refund/return state is absent from the schema."),
    fact(
      "product.compliance-dossier",
      hasProductDossier,
      "No global product/compliance dossier model was found."
    ),
    fact("product.recall-operable", hasRecallDomain, "No recall model was found."),
    fact(
      "security.production-auth",
      productionAuth,
      "The current global password guard is documented for local/staging only."
    ),
    fact(
      "media.production-storage",
      process.env.MEDIA_STORAGE_PROVIDER === "vercel-blob",
      `Configured media provider: ${process.env.MEDIA_STORAGE_PROVIDER ?? "unset"}.`
    ),
    fact("ai.provider-non-mock", nonMockAi, "The current AI factory returns the mock provider."),
  ]);
}

function fact(key: string, value: boolean | undefined, detail: string): AuditEvidence {
  if (value === undefined) return unknown(key, detail);
  return {
    key,
    state: value ? "PASS" : "FAIL",
    provenance: "VERIFIED",
    value,
    detail,
  };
}

function unknown(key: string, detail: string): AuditEvidence {
  return { key, state: "UNKNOWN", provenance: "VERIFIED", detail };
}

function sortEvidence(evidence: AuditEvidence[]): AuditEvidence[] {
  return evidence.sort((left, right) =>
    left.key < right.key ? -1 : left.key > right.key ? 1 : 0
  );
}
