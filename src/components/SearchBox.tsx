"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart/cart-context";

export function SearchBox({ placeholder = "Search products…" }: { placeholder?: string }) {
  const router = useRouter();
  const cart = useCart();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(cart.href(`/search?q=${encodeURIComponent(trimmed)}`));
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full max-w-xs">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="input pr-10"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-theme p-2 text-ink/50 hover:text-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
