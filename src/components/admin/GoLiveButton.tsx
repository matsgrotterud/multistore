"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markStoreLiveAction } from "@/lib/actions/generator";

export function GoLiveButton({ slug, launchStatus }: { slug: string; launchStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (launchStatus === "LIVE") {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        This store is <strong>Live</strong> — canonical URLs use the production domain and pages are
        indexable.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
      <p className="font-semibold">Preview mode</p>
      <p className="mt-1">
        Storefront works on the preview URL. Pages are noindexed until you connect DNS to your
        planned domain and mark Live.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await markStoreLiveAction(slug);
            setMessage(result.ok ? "Store is now Live." : result.error ?? "Failed.");
            if (result.ok) router.refresh();
          })
        }
        className="mt-2 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950 disabled:opacity-50"
      >
        {pending ? "Updating…" : "Mark as Live (domain connected)"}
      </button>
      {message && <p className="mt-2 text-amber-900">{message}</p>}
    </div>
  );
}
