import { wishlistSigningSecret } from "./identity";

export const WISHLIST_V2_FEATURE_FLAG = "STOREFRONT_V2_WISHLIST_ENABLED";

export interface WishlistFeatureDecision {
  enabled: boolean;
  reason:
    | "ENABLED"
    | "FEATURE_FLAG_DISABLED"
    | "SIGNING_SECRET_NOT_CONFIGURED"
    | "MANIFEST_DISABLED";
}

/**
 * Wishlist stays dark by default. A store manifest and the deployment must
 * both opt in, and the server must have a signing key before any persistence.
 */
export function decideWishlistFeature(input: {
  manifestEnabled: boolean;
  env?: NodeJS.ProcessEnv;
}): WishlistFeatureDecision {
  const env = input.env ?? process.env;
  if (!input.manifestEnabled) {
    return { enabled: false, reason: "MANIFEST_DISABLED" };
  }
  if (env[WISHLIST_V2_FEATURE_FLAG] !== "true") {
    return { enabled: false, reason: "FEATURE_FLAG_DISABLED" };
  }
  if (!wishlistSigningSecret(env)) {
    return { enabled: false, reason: "SIGNING_SECRET_NOT_CONFIGURED" };
  }
  return { enabled: true, reason: "ENABLED" };
}
