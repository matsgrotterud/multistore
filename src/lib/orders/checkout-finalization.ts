import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = 1;
export const CHECKOUT_FINALIZATION_TTL_MS = 60 * 60 * 1000;

interface FinalizationCapabilityPayload {
  v: typeof TOKEN_VERSION;
  orderId: string;
  paymentIntentId: string;
  expiresAt: number;
}

/**
 * Production requires an independent high-entropy secret. Development keeps a
 * local-only fallback so mock/test setup does not acquire another prerequisite.
 */
export function checkoutFinalizationSecret(
  env: Record<string, string | undefined> = process.env
): string | null {
  const configured = env.CHECKOUT_FINALIZATION_SECRET?.trim() ?? "";
  if (configured.length >= 32) return configured;
  if (env.NODE_ENV === "production") return null;

  const developmentSecret = env.ADMIN_SESSION_SECRET?.trim() ?? "";
  return developmentSecret.length >= 32
    ? developmentSecret
    : "multistore-local-checkout-finalization-only";
}

export function createCheckoutFinalizationToken(input: {
  orderId: string;
  paymentIntentId: string;
  secret: string;
  now?: Date;
  ttlMs?: number;
}): string {
  const now = input.now ?? new Date();
  const ttlMs = input.ttlMs ?? CHECKOUT_FINALIZATION_TTL_MS;
  if (!input.orderId || !input.paymentIntentId || input.secret.length < 32) {
    throw new Error("Checkout finalization capability is not configured safely.");
  }
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error("Checkout finalization capability expiry is invalid.");
  }

  const payload: FinalizationCapabilityPayload = {
    v: TOKEN_VERSION,
    orderId: input.orderId,
    paymentIntentId: input.paymentIntentId,
    expiresAt: now.getTime() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, input.secret)}`;
}

export function verifyCheckoutFinalizationToken(input: {
  token: string;
  orderId: string;
  paymentIntentId: string;
  secret: string;
  now?: Date;
}): boolean {
  if (
    !input.token ||
    input.token.length > 2048 ||
    !input.orderId ||
    !input.paymentIntentId ||
    input.secret.length < 32
  ) {
    return false;
  }

  const [encoded, suppliedSignature, extra] = input.token.split(".");
  if (!encoded || !suppliedSignature || extra) return false;
  if (!safeEqual(suppliedSignature, signature(encoded, input.secret))) return false;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (!isCapabilityPayload(payload)) return false;

  const nowMs = (input.now ?? new Date()).getTime();
  return (
    Number.isFinite(nowMs) &&
    payload.orderId === input.orderId &&
    payload.paymentIntentId === input.paymentIntentId &&
    payload.expiresAt >= nowMs
  );
}

function signature(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isCapabilityPayload(value: unknown): value is FinalizationCapabilityPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Partial<FinalizationCapabilityPayload>;
  return (
    payload.v === TOKEN_VERSION &&
    typeof payload.orderId === "string" &&
    Boolean(payload.orderId) &&
    typeof payload.paymentIntentId === "string" &&
    Boolean(payload.paymentIntentId) &&
    typeof payload.expiresAt === "number" &&
    Number.isFinite(payload.expiresAt)
  );
}
