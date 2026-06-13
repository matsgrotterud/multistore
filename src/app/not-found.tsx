import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">
        404
      </p>
      <h1 className="text-3xl font-bold text-ink">
        We could not find that page
      </h1>
      <p className="max-w-md text-sm leading-6 text-ink/60">
        The product or page may have been removed, or the link is out of date.
        Head back to the storefront to keep browsing.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to the store
      </Link>
    </main>
  );
}
