/**
 * Rating display with a strict honesty contract: stars are only rendered
 * when real rating data exists. With no data we say so explicitly instead of
 * faking social proof.
 */
export function RatingDisplay({
  ratingAverage,
  ratingCount,
  showEmptyState = false,
}: {
  ratingAverage: number | null;
  ratingCount: number;
  showEmptyState?: boolean;
}) {
  if (ratingAverage === null || ratingCount <= 0) {
    if (!showEmptyState) return null;
    return (
      <p className="text-xs text-ink/50">
        No customer reviews yet — we only show ratings we have actually
        collected.
      </p>
    );
  }

  const rounded = Math.round(ratingAverage * 2) / 2;
  return (
    <p
      className="flex items-center gap-1.5 text-sm"
      aria-label={`Rated ${ratingAverage.toFixed(1)} out of 5 from ${ratingCount} reviews`}
    >
      <span aria-hidden="true" className="flex text-accent">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} viewBox="0 0 20 20" className="h-4 w-4" fill={star <= rounded ? "currentColor" : "none"} stroke="currentColor">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
          </svg>
        ))}
      </span>
      <span className="text-ink/70">
        {ratingAverage.toFixed(1)} ({ratingCount})
      </span>
    </p>
  );
}
