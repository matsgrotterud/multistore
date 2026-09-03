import { checkContent, type GuardrailFlag } from "@/lib/ai/content-guardrails";
import type { ContentPageType } from "@/lib/types";

export const ADMIN_CONTENT_POLICY_VERSION = "admin-content-policy.v1" as const;

export interface AdminContentPolicyInput {
  storeLaunchStatus: string;
  type: ContentPageType;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  requestedPublished: boolean;
  requestedNoindex: boolean;
  siblingTexts?: string[];
  anotherPublishedSingletonExists?: boolean;
}

export interface AdminContentPolicyDecision {
  version: typeof ADMIN_CONTENT_POLICY_VERSION;
  saveAllowed: boolean;
  isPublished: boolean;
  noindex: boolean;
  reasonCodes: string[];
  guardrailFlags: GuardrailFlag[];
}

const ROUTED_TYPES = new Set<ContentPageType>(["GUIDE", "COMPARISON", "FAQ"]);
const SINGLETON_TYPES = new Set<ContentPageType>(["COMPARISON", "FAQ"]);

/**
 * Fail-closed publication policy for admin-authored content. Drafts may retain
 * text that needs revision, but unsafe, thin, duplicate, non-routed or
 * non-LIVE content cannot become indexable.
 */
export function decideAdminContentPolicy(
  input: AdminContentPolicyInput
): AdminContentPolicyDecision {
  const report = checkContent({
    text: [
      input.title,
      input.excerpt,
      input.body,
      input.seoTitle,
      input.seoDescription,
    ].join("\n"),
    siblingTexts: input.siblingTexts,
    pageShowsShippingDisclosure: true,
    pageShowsReturnPolicy: true,
  });
  const reasonCodes: string[] = [];
  if (!report.passed) reasonCodes.push("CONTENT_GUARDRAIL_BLOCKED");
  if (report.recommendNoindex) reasonCodes.push("CONTENT_QUALITY_NOINDEX");
  if (!ROUTED_TYPES.has(input.type)) reasonCodes.push("CONTENT_TYPE_NOT_ROUTED");
  if (
    SINGLETON_TYPES.has(input.type) &&
    input.anotherPublishedSingletonExists
  ) {
    reasonCodes.push("CONTENT_SINGLETON_CONFLICT");
  }
  if (input.storeLaunchStatus !== "LIVE") {
    reasonCodes.push("STORE_NOT_LIVE_NOINDEX");
  }

  const hardPublicationBlock = reasonCodes.some((reason) =>
    [
      "CONTENT_GUARDRAIL_BLOCKED",
      "CONTENT_TYPE_NOT_ROUTED",
      "CONTENT_SINGLETON_CONFLICT",
    ].includes(reason)
  );
  const isPublished = input.requestedPublished && !hardPublicationBlock;
  const noindex =
    input.requestedNoindex ||
    !isPublished ||
    input.storeLaunchStatus !== "LIVE" ||
    report.recommendNoindex;

  return {
    version: ADMIN_CONTENT_POLICY_VERSION,
    saveAllowed: true,
    isPublished,
    noindex,
    reasonCodes: Array.from(new Set(reasonCodes)),
    guardrailFlags: report.flags,
  };
}

export function validateFaqBody(body: string): boolean {
  try {
    const value: unknown = JSON.parse(body);
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (entry) =>
          entry !== null &&
          typeof entry === "object" &&
          typeof (entry as { question?: unknown }).question === "string" &&
          (entry as { question: string }).question.trim().length >= 3 &&
          typeof (entry as { answer?: unknown }).answer === "string" &&
          (entry as { answer: string }).answer.trim().length >= 3
      )
    );
  } catch {
    return false;
  }
}

export function publicContentPath(input: {
  storeSlug: string;
  type: ContentPageType;
  slug: string;
}): string | null {
  if (input.type === "GUIDE") {
    return `/s/${input.storeSlug}/guides/${input.slug}`;
  }
  if (input.type === "COMPARISON") return `/s/${input.storeSlug}/compare`;
  if (input.type === "FAQ") return `/s/${input.storeSlug}`;
  return null;
}
