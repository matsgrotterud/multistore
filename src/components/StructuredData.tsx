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
          dangerouslySetInnerHTML={{ __html: serializeStructuredData(item) }}
        />
      ))}
    </>
  );
}

/** Keep untrusted catalog/admin text from terminating the JSON-LD script tag. */
export function serializeStructuredData(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
