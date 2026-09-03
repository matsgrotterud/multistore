import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
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

export type VerifiedMediaType = "IMAGE" | "VIDEO";

export interface FetchMediaOptions {
  timeoutMs?: number;
  maxFileMb?: number;
  maxRedirects?: number;
  /** Test seam; production uses DNS lookup and rejects every non-public answer. */
  resolveHost?: (hostname: string) => Promise<string[]>;
}

export async function fetchMedia(
  sourceUrl: string,
  options: FetchMediaOptions = {}
): Promise<FetchedMedia> {
  let url = validateMediaUrl(sourceUrl);
  const timeoutMs = options.timeoutMs ?? Number(process.env.SUPPLIER_FETCH_TIMEOUT_MS ?? 15000);
  const maxBytes = (options.maxFileMb ?? Number(process.env.MAX_MEDIA_FILE_MB ?? 12)) * 1024 * 1024;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resolveHost = options.resolveHost ?? resolvePublicAddresses;
    let response: Response | null = null;
    const maxRedirects = options.maxRedirects ?? 3;
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
      await assertPublicMediaTarget(url, resolveHost);
      response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        redirect: "manual",
        headers: {
          Accept: Array.from(allowedContentTypes).join(", "),
          "User-Agent": "multistore-media-ingestion/1.0",
        },
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      if (redirectCount === maxRedirects) {
        throw new Error("Media fetch exceeded the redirect limit.");
      }
      const location = response.headers.get("location");
      if (!location) throw new Error("Media redirect is missing a location.");
      url = validateMediaUrl(new URL(location, url).toString());
    }

    if (!response) throw new Error("Media fetch did not return a response.");

    if (!response.ok) {
      throw new Error(`Media fetch failed (${response.status})`);
    }

    const contentType = normalizeContentType(response.headers.get("content-type"));
    const mediaType = mediaTypeForContentType(contentType);
    if (!mediaType) {
      throw new Error(`Unsupported media type: ${contentType || "unknown"}`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Media exceeds max size (${Math.round(contentLength / 1024 / 1024)} MB).`);
    }

    const body = await readBodyWithLimit(response, maxBytes, controller);
    assertMediaSignatureMatchesContentType(body, contentType);
    return {
      body,
      contentHash: sha256(body),
      contentType,
      fileSize: body.byteLength,
      extension: extensionForContentType(contentType),
      mediaType,
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

  if (parsed.protocol !== "https:") {
    throw new Error(`Rejected media URL protocol: ${parsed.protocol}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("Media URL credentials are not allowed.");
  }
  if (parsed.port && parsed.port !== "443") {
    throw new Error("Media URL must use the default HTTPS port.");
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("Media URL host is not public.");
  }

  return parsed.toString();
}

async function assertPublicMediaTarget(
  sourceUrl: string,
  resolveHost: (hostname: string) => Promise<string[]>
): Promise<void> {
  const parsed = new URL(sourceUrl);
  const addresses = isIP(parsed.hostname)
    ? [parsed.hostname]
    : await resolveHost(parsed.hostname);
  if (addresses.length === 0 || addresses.some((address) => !isPublicIpAddress(address))) {
    throw new Error("Media URL resolved to a private or reserved network address.");
  }
}

async function resolvePublicAddresses(hostname: string): Promise<string[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => result.address);
}

export function isPublicIpAddress(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) {
    const octets = address.split(".").map(Number);
    if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) return false;
    const [a, b, c] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (kind === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPublicIpAddress(normalized.slice("::ffff:".length));
    }
    return !(
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("2001:db8:")
    );
  }
  return false;
}

async function readBodyWithLimit(
  response: Response,
  maxBytes: number,
  controller: AbortController
): Promise<Buffer> {
  if (!response.body) throw new Error("Media response has no body.");
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        controller.abort();
        throw new Error(
          `Media exceeds max size (${Math.round(total / 1024 / 1024)} MB).`
        );
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

export function normalizeContentType(value: string | null): string {
  const normalized = (value ?? "").split(";")[0].trim().toLowerCase();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

export function mediaTypeForContentType(
  value: string | null | undefined
): VerifiedMediaType | null {
  const contentType = normalizeContentType(value ?? null);
  if (!allowedContentTypes.has(contentType)) return null;
  return contentType.startsWith("video/") ? "VIDEO" : "IMAGE";
}

export function requireFetchedMediaTypeMatch(
  declared: VerifiedMediaType | undefined,
  fetched: VerifiedMediaType
): VerifiedMediaType {
  if (declared && declared !== fetched) {
    throw new Error(
      `MEDIA_TYPE_MISMATCH: supplier declared ${declared}, fetched content is ${fetched}.`
    );
  }
  return fetched;
}

export function assertMediaSignatureMatchesContentType(
  body: Buffer,
  contentType: string
): void {
  const normalized = normalizeContentType(contentType);
  const matches = (() => {
    switch (normalized) {
      case "image/jpeg":
        return startsWithBytes(body, [0xff, 0xd8, 0xff]);
      case "image/png":
        return startsWithBytes(body, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      case "image/gif":
        return body.subarray(0, 6).toString("ascii") === "GIF87a" ||
          body.subarray(0, 6).toString("ascii") === "GIF89a";
      case "image/webp":
        return body.subarray(0, 4).toString("ascii") === "RIFF" &&
          body.subarray(8, 12).toString("ascii") === "WEBP";
      case "video/mp4":
        return body.subarray(4, 8).toString("ascii") === "ftyp";
      case "video/webm":
        return startsWithBytes(body, [0x1a, 0x45, 0xdf, 0xa3]);
      default:
        return false;
    }
  })();
  if (!matches) {
    throw new Error(`Media content signature does not match ${normalized || "unknown"}.`);
  }
}

function startsWithBytes(body: Buffer, signature: number[]): boolean {
  return signature.every((value, index) => body[index] === value);
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
