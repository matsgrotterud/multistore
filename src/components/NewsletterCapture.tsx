"use client";

import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { track } from "@/lib/analytics/track";

export function NewsletterCapture({
  storeSlug,
  source = "homepage",
  heading = "Useful emails only",
  subheading = "Buying guides, honest product notes and restock info. No daily spam, unsubscribe anytime.",
}: {
  storeSlug: string;
  source?: string;
  heading?: string;
  subheading?: string;
}) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await subscribeToNewsletter({ storeSlug, email, source });
      setResult(response);
      if (response.ok) {
        setEmail("");
        track(storeSlug, "newsletter_signup", { source });
      }
    });
  }

  return (
    <section
      aria-label="Newsletter signup"
      className="rounded-theme-lg bg-secondary px-6 py-10 text-white sm:px-10"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-bold">{heading}</h2>
        <p className="mt-2 text-sm text-white/80">{subheading}</p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label htmlFor={`newsletter-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`newsletter-${source}`}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="input flex-1 text-ink"
            autoComplete="email"
          />
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
        {result && (
          <p
            role="status"
            className={`mt-3 text-sm ${result.ok ? "text-emerald-300" : "text-red-300"}`}
          >
            {result.message}
          </p>
        )}
      </div>
    </section>
  );
}
