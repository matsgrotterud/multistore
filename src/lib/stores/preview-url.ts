/**
 * Preview URL helpers for stores that are not yet on their planned production domain.
 * On Vercel, all preview stores share the deployment host and are reached via /s/[slug].
 */

export function getDeploymentHost(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
    process.env.VERCEL_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
    "localhost:3000";
  return fromEnv;
}

export function getDeploymentProtocol(host = getDeploymentHost()): "http" | "https" {
  return host.includes("localhost") ? "http" : "https";
}

/** Direct internal path — always works on any deployment host. */
export function getStorePreviewPath(slug: string): string {
  return `/s/${slug}`;
}

export function getStorePreviewUrl(slug: string): string {
  const host = getDeploymentHost();
  const protocol = getDeploymentProtocol(host);
  return `${protocol}://${host}${getStorePreviewPath(slug)}`;
}

/** Clean URL with ?store= — sets the tenant cookie via middleware. */
export function getStoreQueryPreviewUrl(slug: string): string {
  const host = getDeploymentHost();
  const protocol = getDeploymentProtocol(host);
  return `${protocol}://${host}/?store=${encodeURIComponent(slug)}`;
}

export type LaunchStatus = "DRAFT" | "PREVIEW" | "LIVE";

export function isLiveStore(launchStatus: string): boolean {
  return launchStatus === "LIVE";
}

export function launchStatusLabel(launchStatus: string): string {
  switch (launchStatus) {
    case "LIVE":
      return "Live";
    case "DRAFT":
      return "Draft";
    default:
      return "Preview";
  }
}
