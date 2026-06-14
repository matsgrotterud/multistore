/**
 * Fetch marketplace pages through Jina Reader (r.jina.ai) to bypass bot blocks.
 * Optional JINA_API_KEY for higher rate limits — images are stored as remote URLs in DB.
 */

const JINA_BASE = "https://r.jina.ai/";
const FETCH_TIMEOUT_MS = Number(process.env.SUPPLIER_FETCH_TIMEOUT_MS ?? "45000");

export async function fetchReadablePage(targetUrl: string): Promise<string> {
  const readerUrl = `${JINA_BASE}${targetUrl}`;
  const headers: Record<string, string> = {
    Accept: "text/plain",
  };
  const apiKey = process.env.JINA_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(readerUrl, {
      headers,
      signal: controller.signal,
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      throw new Error(`Jina reader failed (${response.status}) for ${targetUrl}`);
    }
    return response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Jina reader timed out after ${FETCH_TIMEOUT_MS}ms for ${targetUrl}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
