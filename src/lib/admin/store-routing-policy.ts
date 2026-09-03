export interface AdminStoreRoutingMutation {
  primaryDomain: string;
  isActive: boolean;
  mutateDomainRows: boolean;
  hostnames: string[];
}

/**
 * Foundation DRAFTs are identity drafts, not routable tenants. The generic
 * settings form may edit their brand data, but cannot activate them, change
 * their preview identity or create Domain authority rows.
 */
export function decideAdminStoreRoutingMutation(input: {
  launchStatus: string;
  currentPrimaryDomain: string;
  requestedPrimaryDomain: string;
  requestedIsActive: boolean;
  requestedAdditionalDomains: readonly string[];
}): AdminStoreRoutingMutation {
  if (input.launchStatus === "DRAFT") {
    return {
      primaryDomain: input.currentPrimaryDomain,
      isActive: false,
      mutateDomainRows: false,
      hostnames: [],
    };
  }
  const primaryDomain = input.requestedPrimaryDomain.trim().toLowerCase();
  return {
    primaryDomain,
    isActive: input.requestedIsActive,
    mutateDomainRows: true,
    hostnames: Array.from(
      new Set(
        [primaryDomain, ...input.requestedAdditionalDomains]
          .map((hostname) => hostname.trim().toLowerCase())
          .filter(Boolean)
      )
    ),
  };
}
