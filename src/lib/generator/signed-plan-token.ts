import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const GENERATOR_SIGNED_PAYLOAD_VERSION =
  "generator-signed-payload.v1" as const;

interface SignedEnvelope<T> {
  version: typeof GENERATOR_SIGNED_PAYLOAD_VERSION;
  kind: string;
  issuedAt: number;
  expiresAt: number;
  payload: T;
}

interface TokenOptions {
  /** Explicit secret for tests. Runtime uses the configured admin/session secret. */
  secret?: string;
  now?: number;
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const MAX_TOKEN_LENGTH = 96_000;

function signingSecret(explicit?: string): string {
  const minimumLength = process.env.NODE_ENV === "production" ? 32 : 12;
  const secret = [
    explicit,
    process.env.GENERATOR_PLAN_SECRET,
    process.env.ADMIN_SESSION_SECRET,
    process.env.ADMIN_PASSWORD,
  ]
    .map((candidate) => candidate?.trim() ?? "")
    .find((candidate) => candidate.length >= minimumLength);

  // Local tests and development may run without an environment file. Tokens
  // never leave that local process, while production remains fail-closed below.
  if (!secret && process.env.NODE_ENV !== "production") {
    return "local-development-generator-plan-secret";
  }
  if (!secret || secret.length < minimumLength) {
    throw new Error(
      "Generator plan signing is not configured. Set a strong ADMIN_SESSION_SECRET or GENERATOR_PLAN_SECRET."
    );
  }
  return secret;
}

function signatureFor(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`multistore-generator-plan:${encodedPayload}`)
    .digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function signGeneratorPayload<T>(
  kind: string,
  payload: T,
  options: TokenOptions = {}
): string {
  const now = options.now ?? Date.now();
  const ttlMs = Math.max(60_000, Math.min(options.ttlMs ?? DEFAULT_TTL_MS, 60 * 60 * 1000));
  const envelope: SignedEnvelope<T> = {
    version: GENERATOR_SIGNED_PAYLOAD_VERSION,
    kind,
    issuedAt: now,
    expiresAt: now + ttlMs,
    payload,
  };
  const encoded = Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
  const token = `${encoded}.${signatureFor(encoded, signingSecret(options.secret))}`;
  if (token.length > MAX_TOKEN_LENGTH) {
    throw new Error("Prepared generator plan is too large to sign safely.");
  }
  return token;
}

export function verifyGeneratorPayload<T>(
  token: string,
  expectedKind: string,
  options: TokenOptions = {}
): T {
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    throw new Error("Prepared generator plan token is missing or invalid.");
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new Error("Prepared generator plan token is malformed.");
  }
  const [encoded, suppliedSignature] = parts;
  const expectedSignature = signatureFor(encoded, signingSecret(options.secret));
  if (!safeEqual(suppliedSignature, expectedSignature)) {
    throw new Error("Prepared generator plan token failed signature verification.");
  }

  let envelope: SignedEnvelope<T>;
  try {
    envelope = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SignedEnvelope<T>;
  } catch {
    throw new Error("Prepared generator plan token payload is invalid.");
  }
  const now = options.now ?? Date.now();
  if (
    envelope.version !== GENERATOR_SIGNED_PAYLOAD_VERSION ||
    envelope.kind !== expectedKind ||
    !Number.isFinite(envelope.issuedAt) ||
    !Number.isFinite(envelope.expiresAt) ||
    envelope.issuedAt > now + 60_000 ||
    envelope.expiresAt <= now
  ) {
    throw new Error("Prepared generator plan token is expired or has the wrong type.");
  }
  return envelope.payload;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)])
    );
  }
  return value;
}

/** Stable digest for plan identity and idempotent replay comparison. */
export function fingerprintGeneratorRequest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}
