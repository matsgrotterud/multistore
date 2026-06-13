"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SORT_OPTIONS = [
  { value: "score", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "shipping", label: "Fastest delivery" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "score";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "score") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-ink/60">
        Sort by
      </label>
      <select
        id="sort"
        className="input w-auto py-2"
        value={current}
        onChange={(event) => handleChange(event.target.value)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
