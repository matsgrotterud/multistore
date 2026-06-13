import type { Metadata } from "next";
import { PolicyPage, buildPolicyMetadata } from "@/components/PolicyPage";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await params;
  return buildPolicyMetadata(store, "privacy");
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { store } = await params;
  return <PolicyPage storeSlug={store} kind="privacy" />;
}
