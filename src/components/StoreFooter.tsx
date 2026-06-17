import Link from "next/link";
import type { Category, Store } from "@prisma/client";
import { categoryHref, storefrontHref } from "@/lib/stores/storefront-links";

export function StoreFooter({
  store,
  categories,
}: {
  store: Store;
  categories: Category[];
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-ink/10 bg-secondary text-white">
      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-extrabold">{store.logoText}</p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            {store.valueProposition}
          </p>
          <p className="mt-4 text-xs text-white/50">
            {store.legalName}
          </p>
        </div>

        <nav aria-label="Shop">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Shop
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={categoryHref(store, category.slug)} className="text-white/80 hover:text-white hover:underline">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href={storefrontHref(store, "/compare")} className="text-white/80 hover:text-white hover:underline">
                Compare top picks
              </Link>
            </li>
            <li>
              <Link href={storefrontHref(store, "/quiz")} className="text-white/80 hover:text-white hover:underline">
                Product finder quiz
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Help and policies">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Help &amp; policies
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={storefrontHref(store, "/guides")} className="text-white/80 hover:text-white hover:underline">
                Buying guides
              </Link>
            </li>
            <li>
              <Link href={storefrontHref(store, "/policies/shipping")} className="text-white/80 hover:text-white hover:underline">
                Shipping policy
              </Link>
            </li>
            <li>
              <Link href={storefrontHref(store, "/policies/returns")} className="text-white/80 hover:text-white hover:underline">
                Returns policy
              </Link>
            </li>
            <li>
              <Link href={storefrontHref(store, "/policies/privacy")} className="text-white/80 hover:text-white hover:underline">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href={storefrontHref(store, "/policies/terms")} className="text-white/80 hover:text-white hover:underline">
                Terms of sale
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
            Support
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <a href={`mailto:${store.supportEmail}`} className="hover:text-white hover:underline">
                {store.supportEmail}
              </a>
            </li>
            {store.supportPhone && <li>{store.supportPhone}</li>}
          </ul>
          <p className="mt-4 text-xs leading-5 text-white/50">
            {store.shippingOriginDisclosure}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-site px-4 py-4 text-xs text-white/50 sm:px-6">
          © {year} {store.legalName}. All prices in {store.currency}. Import
          taxes or duties may apply depending on your country.
        </p>
      </div>
    </footer>
  );
}
