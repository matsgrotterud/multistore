import type { Store } from "@prisma/client";

/**
 * Preview and draft stores must never look launch-approved. This banner is
 * intentionally derived from the persisted launch state, so presentation
 * cannot silently outrun the commerce and catalog review process.
 */
export function StorefrontReviewBanner({
  store,
}: {
  store: Pick<Store, "launchStatus" | "name">;
}) {
  if (store.launchStatus === "LIVE") return null;

  const isDraft = store.launchStatus === "DRAFT";

  return (
    <aside
      aria-label={`${store.name} ${isDraft ? "draft" : "preview"} status`}
      className="border-b border-accent/30 bg-accent/10 text-ink"
    >
      <div className="mx-auto flex max-w-site flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white">
            {isDraft ? "Draft" : "Preview"}
          </span>
          <p className="text-sm leading-6 text-ink/80">
            <strong className="font-semibold text-ink">
              {store.name} is not launch-approved.
            </strong>{" "}
            Product selection, pricing, delivery estimates and checkout
            readiness are still under review.
          </p>
        </div>
        <p className="shrink-0 pl-[4.35rem] text-xs font-semibold uppercase tracking-wide text-ink/60 sm:pl-0">
          Review before launch
        </p>
      </div>
    </aside>
  );
}
