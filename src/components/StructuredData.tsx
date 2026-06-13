/**
 * Renders one or more JSON-LD objects as script tags. Nulls are filtered so
 * callers can pass conditional builders (e.g. faqPageJsonLd) directly.
 */
export function StructuredData({
  data,
}: {
  data: Array<Record<string, unknown> | null>;
}) {
  const items = data.filter(
    (item): item is Record<string, unknown> => item !== null
  );
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
