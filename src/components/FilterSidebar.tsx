"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Category filters encoded in the URL (server component applies them), so
 * filtered views are shareable and crawlable-safe.
 */
export function FilterSidebar({ useCaseOptions }: { useCaseOptions: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const hasFilters = ["maxPrice", "maxDays", "stock", "useCase"].some((key) =>
    searchParams.has(key)
  );

  return (
    <form
      aria-label="Filter products"
      className="card space-y-5 p-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
          Filters
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="text-xs font-medium text-primary underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <label htmlFor="filter-price" className="label">
          Max price
        </label>
        <select
          id="filter-price"
          className="input"
          value={searchParams.get("maxPrice") ?? ""}
          onChange={(event) => setParam("maxPrice", event.target.value)}
        >
          <option value="">Any price</option>
          <option value="25">Up to 25</option>
          <option value="50">Up to 50</option>
          <option value="100">Up to 100</option>
          <option value="250">Up to 250</option>
          <option value="500">Up to 500</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-days" className="label">
          Delivery time
        </label>
        <select
          id="filter-days"
          className="input"
          value={searchParams.get("maxDays") ?? ""}
          onChange={(event) => setParam("maxDays", event.target.value)}
        >
          <option value="">Any speed</option>
          <option value="7">Within 7 days</option>
          <option value="10">Within 10 days</option>
          <option value="14">Within 14 days</option>
        </select>
      </div>

      <div>
        <span className="label">Availability</span>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-primary)]"
            checked={searchParams.get("stock") === "in"}
            onChange={(event) => setParam("stock", event.target.checked ? "in" : "")}
          />
          In stock only
        </label>
      </div>

      {useCaseOptions.length > 0 && (
        <div>
          <label htmlFor="filter-usecase" className="label">
            Use case
          </label>
          <select
            id="filter-usecase"
            className="input"
            value={searchParams.get("useCase") ?? ""}
            onChange={(event) => setParam("useCase", event.target.value)}
          >
            <option value="">All use cases</option>
            {useCaseOptions.map((useCase) => (
              <option key={useCase} value={useCase}>
                {useCase.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  );
}
