import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  WISHLIST_IDENTITY_VERSION,
  wishlistIdentityPayloadSchema,
  type WishlistIdentityPayload,
} from "./contracts";

const DEFAULT_IDENTITY_TTL_SECONDS = 60 * 60 * 24 * 365;

export interface WishlistIdentityTarget {
  storeId: string;
  storeSlug: string;
}

export function wishlistCookieName(storeSlug: string): string {
  const suffix = createHash("sha256").update(storeSlug).digest("hex").slice(0, 12);
  return `msdf_wishlist_${suffix}`;
}

export function createWishlistIdentity(input: {
  target: WishlistIdentityTarget;
  secret: string;
  now?: Date;
  ttlSeconds?: number;
  createId?: () => string;
}): { payload: WishlistIdentityPayload; token: string } {
  assertSigningSecret(input.secret);
  const now = input.now ?? new Date();
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_IDENTITY_TTL_SECONDS;
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error("Wishlist identity TTL must be a positive integer.");
  }
  const payload = wishlistIdentityPayloadSchema.parse({
    version: WISHLIST_IDENTITY_VERSION,
    storeId: input.target.storeId,
    storeSlug: input.target.storeSlug,
    anonymousId: (input.createId ?? randomUUID)(),
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
  });
  return { payload, token: signPayload(payload, input.secret) };
}

export function verifyWishlistIdentity(input: {
  token: string | null | undefined;
  target: WishlistIdentityTarget;
  secret: string;
  now?: Date;
}): WishlistIdentityPayload | null {
  assertSigningSecret(input.secret);
  if (!input.token) return null;
  const separator = input.token.lastIndexOf(".");
  if (separator <= 0 || separator === input.token.length - 1) return null;
  const encoded = input.token.slice(0, separator);
  const receivedSignature = input.token.slice(separator + 1);
  const expectedSignature = signatureFor(encoded, input.secret);
  if (!safeEqual(receivedSignature, expectedSignature)) return null;

  try {
    const parsed = wishlistIdentityPayloadSchema.safeParse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    );
    if (!parsed.success) return null;
    if (
      parsed.data.storeId !== input.target.storeId ||
      parsed.data.storeSlug !== input.target.storeSlug
    ) {
      return null;
    }
    const now = (input.now ?? new Date()).getTime();
    const issuedAt = Date.parse(parsed.data.issuedAt);
    const expiresAt = Date.parse(parsed.data.expiresAt);
    if (issuedAt > now + 60_000 || expiresAt <= now || expiresAt <= issuedAt) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function wishlistSigningSecret(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const configured = env.WISHLIST_SIGNING_SECRET?.trim() ?? "";
  if (configured.length >= 32) return configured;
  if (env.NODE_ENV !== "production") {
    const developmentSecret = env.ADMIN_SESSION_SECRET?.trim() ?? "";
    if (developmentSecret.length >= 32) return developmentSecret;
  }
  return null;
}

function signPayload(payload: WishlistIdentityPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signatureFor(encoded, secret)}`;
}

function signatureFor(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

function assertSigningSecret(secret: string): void {
  if (secret.trim().length < 32) {
    throw new Error("Wishlist signing secret must contain at least 32 characters.");
  }
}
