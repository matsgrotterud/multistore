/**
 * Honest shipping window display. Always shows the realistic supplier window
 * — never "ships today" — per the platform's transparency rules.
 */
export function ShippingEstimate({
  daysMin,
  daysMax,
  originNote,
  compact = false,
}: {
  daysMin: number;
  daysMax: number;
  originNote?: string | null;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "text-xs text-ink/70" : "text-sm text-ink/80"}>
      <p className="flex items-center gap-1.5">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 8h13v8H1zM14 11h4l3 3v2h-7z" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="1.6" />
          <circle cx="17.5" cy="18" r="1.6" />
        </svg>
        <span>
          Delivery in <strong>{daysMin}–{daysMax} business days</strong>
        </span>
      </p>
      {!compact && originNote && (
        <p className="mt-1 text-xs text-ink/60">{originNote}</p>
      )}
    </div>
  );
}
