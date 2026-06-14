import { sha256 } from "@/lib/media/hash";

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export interface FetchedMedia {
  body: Buffer;
  contentHash: string;
  contentType: string;
  fileSize: number;
  extension: string;
  mediaType: "IMAGE" | "VIDEO";
}

export interface FetchMediaOptions {
  timeoutMs?: number;
  maxFileMb?: number;
}

export async function fetchMedia(
  sourceUrl: string,
  options: FetchMediaOptions = {}
): Promise<FetchedMedia> {
  const url = validateMediaUrl(sourceUrl);
  const timeoutMs = options.timeoutMs ?? Number(process.env.SUPPLIER_FETCH_TIMEOUT_MS ?? 15000);
  const maxBytes = (options.maxFileMb ?? Number(process.env.MAX_MEDIA_FILE_MB ?? 12)) * 1024 * 1024;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: Array.from(allowedContentTypes).join(", "),
        "User-Agent": "multistore-media-ingestion/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Media fetch failed (${response.status})`);
    }

    const contentType = normalizeContentType(response.headers.get("content-type"));
    if (!allowedContentTypes.has(contentType)) {
      throw new Error(`Unsupported media type: ${contentType || "unknown"}`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Media exceeds max size (${Math.round(contentLength / 1024 / 1024)} MB).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(`Media exceeds max size (${Math.round(arrayBuffer.byteLength / 1024 / 1024)} MB).`);
    }

    const body = Buffer.from(arrayBuffer);
    return {
      body,
      contentHash: sha256(body),
      contentType,
      fileSize: body.byteLength,
      extension: extensionForContentType(contentType),
      mediaType: contentType.startsWith("video/") ? "VIDEO" : "IMAGE",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function validateMediaUrl(sourceUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error("Media URL must be absolute.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Rejected media URL protocol: ${parsed.protocol}`);
  }

  return parsed.toString();
}

function normalizeContentType(value: string | null): string {
  return (value ?? "").split(";")[0].trim().toLowerCase();
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

