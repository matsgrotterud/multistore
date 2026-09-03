export function checkoutTenantMatches(input: {
  isProduction: boolean;
  requestedStoreSlug: string | null;
  hostStoreSlug: string | null;
}): boolean {
  if (!input.isProduction) return true;
  return Boolean(
    input.requestedStoreSlug &&
      input.hostStoreSlug &&
      input.requestedStoreSlug === input.hostStoreSlug
  );
}
