/**
 * A noindex singleton may be previewed only when the entire store is already
 * non-LIVE/noindex. On a LIVE homepage, suppress it so thin or blocked FAQ
 * text and FAQ JSON-LD cannot leak into an indexable document.
 */
export function includeNoindexSingletonContent(
  storeLaunchStatus: string
): boolean {
  return storeLaunchStatus !== "LIVE";
}

export function contentPageRequiresNoindex(
  page: { isPublished: boolean; noindex: boolean } | null
): boolean {
  return page !== null && (!page.isPublished || page.noindex);
}
