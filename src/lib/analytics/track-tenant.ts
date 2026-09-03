export function canAcceptTrackedTenant(input: {
  production: boolean;
  requestedStoreSlug: string;
  resolvedHostStoreSlug: string | null;
}): boolean {
  if (!input.production) return true;
  return (
    input.resolvedHostStoreSlug !== null &&
    input.resolvedHostStoreSlug === input.requestedStoreSlug
  );
}
