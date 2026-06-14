import { prisma } from "@/lib/db";
import { alibabaProvider } from "@/lib/suppliers/providers/alibaba-provider";
import { aliexpressProvider } from "@/lib/suppliers/providers/aliexpress-provider";
import { amazonProvider } from "@/lib/suppliers/providers/amazon-provider";
import { ebayProvider } from "@/lib/suppliers/providers/ebay-provider";
import { mockCommerceProvider } from "@/lib/suppliers/providers/mock-provider";
import { temuProvider } from "@/lib/suppliers/providers/temu-provider";
import type { CommerceProvider, ProviderKey } from "@/lib/suppliers/providers/types";
import { wishProvider } from "@/lib/suppliers/providers/wish-provider";
import { toJson } from "@/lib/utils/json";

const providers: CommerceProvider[] = [
  mockCommerceProvider,
  ebayProvider,
  aliexpressProvider,
  temuProvider,
  amazonProvider,
  wishProvider,
  alibabaProvider,
];

const providerMap = new Map<ProviderKey, CommerceProvider>(
  providers.map((provider) => [provider.key, provider])
);

export function getCommerceProvider(providerKey: ProviderKey | string): CommerceProvider {
  const provider = providerMap.get(providerKey as ProviderKey);
  if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
  return provider;
}

export function getCommerceProviders(): CommerceProvider[] {
  return providers;
}

export async function syncProviderRegistryToDb(): Promise<void> {
  for (const provider of providers) {
    const health = await provider.getHealth();
    await prisma.supplierProvider.upsert({
      where: { key: provider.key },
      update: {
        name: provider.name,
        type: provider.key === "mock" ? "MOCK" : health.defaultFulfillmentMode === "AFFILIATE" ? "AFFILIATE" : "MARKETPLACE",
        isEnabled: provider.key === "mock" || health.status === "OK",
        supportsSearch: health.capabilities.search,
        supportsProductDetails: health.capabilities.details,
        supportsImages: health.capabilities.images,
        supportsVideo: health.capabilities.video,
        supportsInventory: health.capabilities.inventory,
        supportsPricing: health.capabilities.pricing,
        supportsCheckout: health.capabilities.checkout,
        supportsTracking: health.capabilities.tracking,
        supportsReturns: health.capabilities.returns,
        defaultFulfillmentMode: health.defaultFulfillmentMode,
        reliabilityScore: provider.key === "mock" ? 0.85 : 0.75,
        averageShippingDays: provider.key === "mock" ? 10 : 14,
        configJson: toJson({ health }),
      },
      create: {
        key: provider.key,
        name: provider.name,
        type: provider.key === "mock" ? "MOCK" : health.defaultFulfillmentMode === "AFFILIATE" ? "AFFILIATE" : "MARKETPLACE",
        isEnabled: provider.key === "mock" || health.status === "OK",
        supportsSearch: health.capabilities.search,
        supportsProductDetails: health.capabilities.details,
        supportsImages: health.capabilities.images,
        supportsVideo: health.capabilities.video,
        supportsInventory: health.capabilities.inventory,
        supportsPricing: health.capabilities.pricing,
        supportsCheckout: health.capabilities.checkout,
        supportsTracking: health.capabilities.tracking,
        supportsReturns: health.capabilities.returns,
        defaultFulfillmentMode: health.defaultFulfillmentMode,
        reliabilityScore: provider.key === "mock" ? 0.85 : 0.75,
        averageShippingDays: provider.key === "mock" ? 10 : 14,
        configJson: toJson({ health }),
      },
    });
  }
}

