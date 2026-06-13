import { redirect } from "next/navigation";
import { DEFAULT_STORE_SLUG } from "@/config/domain-map";

export const dynamic = "force-dynamic";

/**
 * The middleware rewrites "/" to the resolved tenant before this page can
 * render, so this only runs if middleware was bypassed (e.g. direct render
 * during development tooling). Fall back to the default store.
 */
export default function RootPage() {
  redirect(`/s/${DEFAULT_STORE_SLUG}`);
}
