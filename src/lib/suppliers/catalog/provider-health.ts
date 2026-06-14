import { getCommerceProviders, syncProviderRegistryToDb } from "@/lib/suppliers/providers/registry";

export async function getProviderHealthReport() {
  await syncProviderRegistryToDb();
  return Promise.all(getCommerceProviders().map((provider) => provider.getHealth()));
}

