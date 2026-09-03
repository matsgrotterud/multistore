"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getBoolean, getOptionalString, getString } from "@/lib/actions/form";
import { prisma } from "@/lib/db";
import {
  decideAdminContentPolicy,
  validateFaqBody,
} from "@/lib/content/admin-content-policy";
import { contentPageTypeSchema } from "@/lib/validation/schemas";

export interface AdminContentActionState {
  ok: boolean;
  error: string | null;
  message?: string;
  contentId?: string;
}

const contentDraftSchema = z.object({
  storeId: z.string().min(1),
  contentId: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug"),
  type: contentPageTypeSchema,
  title: z.string().trim().min(3).max(120),
  excerpt: z.string().trim().min(20).max(360),
  body: z.string().trim().min(20).max(60_000),
  seoTitle: z.string().trim().min(10).max(70),
  seoDescription: z.string().trim().min(40).max(170),
  heroImageUrl: z.string().url().nullable(),
  requestedPublished: z.boolean(),
  requestedNoindex: z.boolean(),
});

export async function saveContentPageAction(
  _previous: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();
  const parsed = contentDraftSchema.safeParse({
    storeId: getString(formData, "storeId"),
    contentId: getOptionalString(formData, "contentId") ?? undefined,
    slug: getString(formData, "slug").toLowerCase(),
    type: getString(formData, "type"),
    title: getString(formData, "title"),
    excerpt: getString(formData, "excerpt"),
    body: getString(formData, "body"),
    seoTitle: getString(formData, "seoTitle"),
    seoDescription: getString(formData, "seoDescription"),
    heroImageUrl: getOptionalString(formData, "heroImageUrl"),
    requestedPublished: getBoolean(formData, "isPublished"),
    requestedNoindex: getBoolean(formData, "noindex"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid content draft.",
    };
  }
  const data = parsed.data;
  if (data.type === "FAQ" && !validateFaqBody(data.body)) {
    return {
      ok: false,
      error:
        'FAQ body must be a JSON array such as [{"question":"...","answer":"..."}].',
    };
  }

  let outcome:
    | {
        store: { id: string; slug: string; launchStatus: string };
        saved: { id: string; isPublished: boolean; noindex: boolean };
        decision: ReturnType<typeof decideAdminContentPolicy>;
      }
    | { error: string };
  try {
    outcome = await prisma.$transaction(async (tx) => {
      // Serialize every content mutation for one tenant. This is the database
      // boundary that makes slug and published-singleton checks race-safe.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`admin-content:${data.storeId}`}))`;
      const store = await tx.store.findUnique({
        where: { id: data.storeId },
        select: { id: true, slug: true, launchStatus: true },
      });
      if (!store) return { error: "Store not found." };

      const existing = data.contentId
        ? await tx.contentPage.findFirst({
            where: { id: data.contentId, storeId: store.id },
          })
        : null;
      if (data.contentId && !existing) {
        return { error: "Content page does not belong to this store." };
      }
      const slugConflict = await tx.contentPage.findFirst({
        where: {
          storeId: store.id,
          slug: data.slug,
          ...(existing ? { id: { not: existing.id } } : {}),
        },
        select: { id: true },
      });
      if (slugConflict) {
        return { error: `Slug ${data.slug} already exists in this store.` };
      }

      const siblings = await tx.contentPage.findMany({
        where: {
          storeId: store.id,
          ...(existing ? { id: { not: existing.id } } : {}),
        },
        select: { type: true, isPublished: true, body: true },
      });
      const decision = decideAdminContentPolicy({
        storeLaunchStatus: store.launchStatus,
        type: data.type,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        requestedPublished: data.requestedPublished,
        requestedNoindex: data.requestedNoindex,
        siblingTexts: siblings.map((sibling) => sibling.body),
        anotherPublishedSingletonExists: siblings.some(
          (sibling) => sibling.type === data.type && sibling.isPublished
        ),
      });
      const write = {
        storeId: store.id,
        slug: data.slug,
        type: data.type,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        heroImageUrl: data.heroImageUrl,
        isPublished: decision.isPublished,
        noindex: decision.noindex,
      };
      const saved = existing
        ? await tx.contentPage.update({ where: { id: existing.id }, data: write })
        : await tx.contentPage.create({
            data: { ...write, relatedProductIds: "[]" },
          });
      return { store, saved, decision };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Content slug already exists in this store." };
    }
    console.error("admin content save failed", error);
    return { ok: false, error: "Could not save the content draft." };
  }
  if ("error" in outcome) return { ok: false, error: outcome.error };
  const { store, saved, decision } = outcome;

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${saved.id}/edit`);
  revalidatePath(`/s/${store.slug}`, "layout");

  const enforcement = decision.reasonCodes.length
    ? ` Enforcement: ${decision.reasonCodes.join(", ")}.`
    : "";
  return {
    ok: true,
    error: null,
    contentId: saved.id,
    message: `Content saved as ${saved.isPublished ? "published" : "unpublished"} + ${saved.noindex ? "noindex" : "indexable"}.${enforcement}`,
  };
}
