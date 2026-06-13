import Link from "next/link";
import type { Category, Store } from "@prisma/client";
import { CartButton } from "@/components/CartButton";
import { SearchBox } from "@/components/SearchBox";

export function StoreHeader({
  store,
  categories,
}: {
  store: Store;
  categories: Category[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-site items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0" aria-label={`${store.name} home`}>
          <span className="font-heading text-xl font-extrabold tracking-tight text-primary">
            {store.logoText}
          </span>
        </Link>

        <nav aria-label="Categories" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/c/${category.slug}`}
                  className="rounded-theme px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-primary-soft hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/guides"
                className="rounded-theme px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-primary-soft hover:text-primary"
              >
                Guides
              </Link>
            </li>
            <li>
              <Link
                href="/quiz"
                className="rounded-theme px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-primary-soft hover:text-primary"
              >
                Quiz
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBox />
          </div>
          <Link
            href="/search"
            className="rounded-theme p-2 text-ink/70 hover:bg-primary-soft hover:text-primary md:hidden"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile category strip */}
      <nav aria-label="Categories" className="border-t border-ink/5 lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-4 py-2">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                href={`/c/${category.slug}`}
                className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/75 hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link
              href="/guides"
              className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/75 hover:border-primary hover:text-primary"
            >
              Guides
            </Link>
          </li>
          <li className="shrink-0">
            <Link
              href="/quiz"
              className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/75 hover:border-primary hover:text-primary"
            >
              Quiz
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
