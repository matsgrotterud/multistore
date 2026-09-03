import type {
  CommerceProvider,
  ProviderHealth,
} from "@/lib/suppliers/providers/types";

const DEFAULT_HEALTH_CACHE_TTL_MS = 60_000;

interface ProviderHealthCacheEntry {
  expiresAt: number;
  value: Promise<ProviderHealth>;
}

// Providers in the registry are process-level singletons. A WeakMap keeps the
// cache isolated by provider instance, which also prevents test doubles or a
// future tenant-specific adapter from sharing health evidence accidentally.
let providerHealthCache = new WeakMap<CommerceProvider, ProviderHealthCacheEntry>();

/**
 * Coalesces repeated provider canaries inside one worker process. Product
 * details are still fetched for every selected product; this only prevents a
 * 20-job batch from running the same provider health search 20 times.
 */
export async function getCachedProviderHealth(
  provider: CommerceProvider,
  options: {
    nowMs?: number;
    ttlMs?: number;
  } = {}
): Promise<ProviderHealth> {
  const nowMs = options.nowMs ?? Date.now();
  const ttlMs = boundedTtl(options.ttlMs);
  const cached = providerHealthCache.get(provider);
  if (cached && cached.expiresAt > nowMs) return cached.value;

  const value = provider.getHealth();
  providerHealthCache.set(provider, {
    expiresAt: nowMs + ttlMs,
    value,
  });
  try {
    return await value;
  } catch (error) {
    // A rejected promise must not poison the whole TTL. The caller controls
    // retry/backoff through the catalog job queue.
    const current = providerHealthCache.get(provider);
    if (current?.value === value) providerHealthCache.delete(provider);
    throw error;
  }
}

export function resetProviderHealthCacheForTests(): void {
  providerHealthCache = new WeakMap<CommerceProvider, ProviderHealthCacheEntry>();
}

function boundedTtl(value: number | undefined): number {
  if (value === undefined) return DEFAULT_HEALTH_CACHE_TTL_MS;
  if (!Number.isFinite(value)) return DEFAULT_HEALTH_CACHE_TTL_MS;
  return Math.min(Math.max(Math.floor(value), 1_000), 5 * 60_000);
}
