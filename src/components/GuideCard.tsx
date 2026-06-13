import Link from "next/link";
import type { ContentPage } from "@prisma/client";

export function GuideCard({ guide }: { guide: ContentPage }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="card group flex h-full flex-col gap-3 p-6 transition hover:border-primary"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Buying guide
      </p>
      <h3 className="text-lg font-bold leading-snug text-ink group-hover:text-primary">
        {guide.title}
      </h3>
      <p className="line-clamp-3 flex-1 text-sm leading-6 text-ink/70">
        {guide.excerpt}
      </p>
      <p className="text-sm font-medium text-primary">Read the guide →</p>
    </Link>
  );
}
