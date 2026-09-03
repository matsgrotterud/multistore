"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { StoreBlueprint } from "@/lib/ai/types";
import type { GuardrailReport } from "@/lib/ai/content-guardrails";
import type { StoreBlueprintPreparation } from "@/lib/ai/store-blueprint";
import {
  confirmProductClassAction,
  createStoreFromBlueprintAction,
  generateBlueprintAction,
  generateProductCopyAction,
} from "@/lib/actions/generator";
import type { CreateStoreFromBlueprintResult } from "@/lib/stores/create-from-blueprint";

function GuardrailSummary({ report }: { report: GuardrailReport }) {
  return (
    <div
      className={`mt-3 rounded-lg border p-3 text-xs ${
        report.passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      <p className="font-semibold">
        Guardrails: {report.passed ? "passed" : "blocked"}
        {report.recommendNoindex ? " · noindex recommended" : ""}
      </p>
      {report.flags.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-1 pl-4">
          {report.flags.map((flag, index) => (
            <li key={index}>
              [{flag.severity}] {flag.rule}: {flag.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(value, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative mt-3">
      <button
        type="button"
        onClick={copy}
        className="absolute right-3 top-3 rounded-md bg-slate-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-600"
      >
        {copied ? "Copied!" : "Copy JSON"}
      </button>
      <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-5 text-slate-100">
        {json}
      </pre>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const inlineSpinnerClass =
  "h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white";

/**
 * Honest, generic progressive labels. The backend runs synchronously and does
 * not report step-by-step progress, so these are phrased as "what may be
 * happening now" and never claim a specific step finished.
 */
const STATUS_MESSAGES = [
  "Building store blueprint",
  "Planning categories and supplier searches",
  "Searching supplier catalog",
  "Checking product relevance",
  "Saving media to storage",
  "Evaluating preview visibility gates",
] as const;

/**
 * Live progress panel shown only while generation is pending. Mounts on submit
 * and unmounts on completion, so its timer and message rotation reset
 * automatically each run.
 */
function GenerationProgress() {
  const [seconds, setSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const rotate = setInterval(
      () => setMessageIndex((value) => (value + 1) % STATUS_MESSAGES.length),
      3500
    );
    return () => clearInterval(rotate);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"
    >
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
        <div className="flex flex-1 items-center justify-between gap-3">
          <p className="font-semibold">Generating store…</p>
          <p className="font-mono text-xs text-blue-700">Running for {seconds}s</p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-blue-800">What is happening now may include:</p>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
          {STATUS_MESSAGES[messageIndex]}…
        </p>
        {/* Subtle indeterminate bar — no fake percentage. */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
        </div>
      </div>

      <p className="mt-3 text-xs text-blue-800">
        This can take 1–3 minutes when supplier media is imported.{" "}
        <strong>Do not refresh this page while generation is running.</strong> Product discovery and
        media import can take a little while.
      </p>
    </div>
  );
}

function LaunchFailure({
  error,
  onRetry,
  retrying,
}: {
  error: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-950"
    >
      <p className="text-base font-bold">Generation failed</p>
      <p className="mt-1">
        Something went wrong while creating the store. Your form input has been kept — you can
        adjust it and try again.
      </p>
      <p className="mt-3 text-xs text-red-900">
        The store may have been <strong>partially created</strong> (store, categories or some
        products) before the error. Nothing is shown as published unless it succeeded.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-red-900">
        <li>
          Check the{" "}
          <Link href="/admin/stores" className="font-semibold underline">
            Stores page
          </Link>{" "}
          to see if a partial store exists.
        </li>
        <li>
          Run <code className="rounded bg-red-100 px-1">pnpm run debug:generation:local -- --latest</code>{" "}
          to see categories, candidates, rejection reasons and media counts.
        </li>
        <li>Adjust the niche / product keywords and try again.</li>
      </ul>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {retrying && <span className={inlineSpinnerClass} aria-hidden="true" />}
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-red-800">
          Technical error details
        </summary>
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-red-100 p-3 text-[11px] leading-5 text-red-900">
          {error}
        </pre>
      </details>
    </div>
  );
}

interface BlueprintFormValues {
  domain: string;
  testOnly: boolean;
  niche: string;
  targetCustomer: string;
  endUser: string;
  ageRange: string;
  supplierSearchHints: string;
  negativeKeywords: string;
  categoryHints: string;
  pricePositioning: string;
  productCountGoal: string;
  brandVoice: string;
  locale: string;
  country: string;
}

function buildBlueprintInput(values: BlueprintFormValues) {
  return {
    domain: values.testOnly ? undefined : values.domain || undefined,
    niche: values.niche,
    targetCustomer: values.targetCustomer || undefined,
    endUser: values.endUser || undefined,
    ageRange: values.ageRange || undefined,
    supplierSearchHints: values.supplierSearchHints,
    negativeKeywords: values.negativeKeywords,
    categoryHints: values.categoryHints,
    pricePositioning: values.pricePositioning || "value",
    productCountGoal: values.productCountGoal || "standard",
    brandVoice: values.brandVoice || "clear, honest, practical",
    locale: values.locale || "en-US",
    country: values.country || "United States",
  };
}

function newGenerationKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function BlueprintSummary({ blueprint }: { blueprint: StoreBlueprint }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <p className="font-bold text-slate-900">{blueprint.brandName}</p>
      <p className="mt-1 text-slate-600">{blueprint.tagline}</p>
      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-800">Slug</dt>
          <dd className="font-mono">{blueprint.storeSlug}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-800">Validated V3 category</dt>
          <dd>{blueprint.categories.map((category) => category.name).join(", ")}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-800">Validated V3 supplier queries</dt>
          <dd className="font-mono text-[11px]">
            {blueprint.productImportQueries.slice(0, 8).join(" · ")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-800">SEO title</dt>
          <dd>{blueprint.seoTitle}</dd>
        </div>
      </dl>
      {blueprint.qualityChecklist.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-800">Launch checklist</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-600">
            {blueprint.qualityChecklist.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RuntimeClassProposalPanel({
  plan,
  onConfirm,
  confirming,
}: {
  plan: Extract<
    StoreBlueprintPreparation,
    { status: "NEEDS_PRODUCT_CLASS_CONFIRMATION" }
  >;
  onConfirm: (acknowledged: boolean) => void;
  confirming: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-bold">Confirm the proposed physical product class</p>
      <p className="mt-1">
        This niche is clear enough for a provisional catalog class, but the class is not part of
        the reusable reviewed ontology yet. Confirming it authorizes only this internal noindex
        preview.
      </p>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-medium opacity-70">Provisional class</dt>
          <dd className="break-all font-mono font-semibold">{plan.proposal.productClass}</dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Canonical category</dt>
          <dd>{plan.proposal.category.name}</dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Required product evidence</dt>
          <dd>{plan.proposal.classConcepts.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Policy</dt>
          <dd className="font-mono font-semibold">{plan.proposal.policyDecision}</dd>
        </div>
      </dl>
      <p className="mt-3 break-words font-mono text-[11px]">
        supplier queries: {plan.queryPlan.queries.map((entry) => entry.query).join(" · ")}
      </p>
      <p className="mt-2 break-words font-mono text-[11px]">
        exclusions: {plan.proposal.excludedClasses.flatMap((entry) => entry.concepts).join(" · ")}
      </p>
      <label className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-white p-3 text-xs">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          I confirm that this describes one physical product class. This does not approve product
          safety, compliance, supplier reliability or live sales.
        </span>
      </label>
      <button
        type="button"
        disabled={!acknowledged || confirming}
        aria-busy={confirming}
        onClick={() => onConfirm(acknowledged)}
        className="mt-3 rounded-md bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {confirming ? "Confirming class…" : "Confirm class & generate blueprint"}
      </button>
      <p className="mt-2 text-xs font-medium">
        Live commerce remains blocked. A separate reviewed-class and launch approval is required.
      </p>
    </div>
  );
}

function IntentPlanSummary({
  plan,
  onConfirm,
  confirming,
}: {
  plan: StoreBlueprintPreparation;
  onConfirm: (acknowledged: boolean) => void;
  confirming: boolean;
}) {
  if (plan.status === "BLOCKED") {
    return (
      <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">
        <p className="font-bold">Product class blocked by policy</p>
        <p className="mt-1">
          No supplier query, creative blueprint, generation run or store was created.
        </p>
        <p className="mt-3 font-mono text-xs">{plan.reasonCodes.join(" · ")}</p>
      </div>
    );
  }

  if (plan.status === "NEEDS_PRODUCT_CLASS_CONFIRMATION") {
    return (
      <RuntimeClassProposalPanel
        key={plan.proposal.profileHash}
        plan={plan}
        onConfirm={onConfirm}
        confirming={confirming}
      />
    );
  }

  if (plan.status === "NEEDS_PRODUCT_CLASS") {
    return (
      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-bold">Product class confirmation required</p>
        <p className="mt-1">
          V3 could not map this description to a reviewed product class. No creative blueprint,
          supplier query, generation run or store tenant was created.
        </p>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-medium opacity-70">Normalized intent</dt>
            <dd className="font-mono">{plan.intent.normalizedNiche || "empty"}</dd>
          </div>
          <div>
            <dt className="font-medium opacity-70">Reason</dt>
            <dd className="font-mono">
              {plan.intent.reasonCodes.join(", ") || "INSUFFICIENT_INTENT_EVIDENCE"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs">
          Enter one concrete physical product type rather than a broad collection, lifestyle,
          accessory or gift concept. Clear low-risk classes are proposed for confirmation here;
          risky or ambiguous classes remain blocked.
        </p>
      </div>
    );
  }

  const category = plan.blueprint.categories[0];
  return (
    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">V3 catalog plan resolved</p>
          <p className="mt-1 text-xs text-blue-900/80">
            This class, category and query plan — not AI merchandising suggestions — control product
            discovery and relevance.
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-blue-200">
          {Math.round(plan.intent.confidence * 100)}% confidence
        </span>
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-medium opacity-70">Product class</dt>
          <dd className="font-mono font-semibold">{plan.intent.productClass}</dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Class source</dt>
          <dd>
            {plan.classProfile.source === "RUNTIME_PROVISIONAL"
              ? "Admin-confirmed provisional preview class"
              : "Reviewed static ontology"}
          </dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Policy</dt>
          <dd className="font-mono font-semibold">{plan.intent.policyDecision}</dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Canonical category</dt>
          <dd>{category?.name ?? "No category"}</dd>
        </div>
        <div>
          <dt className="font-medium opacity-70">Live commerce</dt>
          <dd>{plan.intent.liveCommerceAllowed ? "Product-policy eligible" : "Blocked"}</dd>
        </div>
      </dl>
      {plan.intent.riskFlags.length > 0 && (
        <p className="mt-3 text-xs">
          <strong>Review flags:</strong> {plan.intent.riskFlags.join(" · ")}
        </p>
      )}
      <p className="mt-2 break-words font-mono text-[11px] text-blue-900">
        queries: {plan.queryPlan.queries.map((entry) => entry.query).join(" · ")}
      </p>
      {plan.intent.policyDecision === "MANUAL_REVIEW_REQUIRED" && (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950">
          This class may only create an internal noindex preview. Live commerce remains blocked until
          the required merchant and compliance review is recorded.
        </p>
      )}
    </div>
  );
}

/**
 * Distinct, real category links derived from imported product preview paths
 * (`/s/{slug}/c/{category}/p/{product}`). The result object does not return
 * category slugs directly, so we only show links we can prove exist.
 */
function categoryLinksFromResult(result: CreateStoreFromBlueprintResult) {
  const seen = new Map<string, string>();
  for (const product of result.products) {
    if (!product.published) continue;
    const match = product.previewPath.match(/^(\/s\/[^/]+\/c\/([^/]+))\//);
    if (match && !seen.has(match[1])) {
      seen.set(match[1], match[2].replace(/-/g, " "));
    }
  }
  return [...seen.entries()].map(([path, label]) => ({ path, label }));
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-white/70 px-2.5 py-1.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function LaunchSuccess({ result }: { result: CreateStoreFromBlueprintResult }) {
  const mediaCount = result.products.reduce((total, product) => total + product.imageCount, 0);
  const categoryLinks = categoryLinksFromResult(result);
  const isReady = result.generationStatus === "READY_FOR_PREVIEW";
  const needsReview =
    result.generationStatus === "READY_FOR_INTERNAL_PREVIEW_MANUAL_REVIEW";
  const tone = isReady
    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
    : needsReview
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-red-300 bg-red-50 text-red-950";
  const title = isReady
    ? "Preview ready"
    : needsReview
      ? "Internal preview ready — manual review required"
      : `Generation stopped — ${result.generationStatus.replaceAll("_", " ").toLowerCase()}`;
  return (
    <div className={`mt-4 rounded-xl border p-5 text-sm ${tone}`}>
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1">
        {result.previewReady ? (
          <>
            <strong>{result.storeName}</strong> has an internal, noindex preview. This is not a
            live-commerce approval.
          </>
        ) : (
          <>
            No visible storefront was approved. {result.storeSlug ? "An inactive DRAFT was retained for diagnostics." : "No store tenant was created."}
          </>
        )}
      </p>

      <dl className="mt-4 grid gap-2 rounded-lg border border-current/15 bg-white/50 p-3 text-xs sm:grid-cols-3">
        <div><dt className="font-medium opacity-65">Run</dt><dd className="mt-0.5 break-all font-mono">{result.runId}</dd></div>
        <div><dt className="font-medium opacity-65">Product class</dt><dd className="mt-0.5 font-semibold">{result.productClass ?? "UNKNOWN"}</dd></div>
        <div><dt className="font-medium opacity-65">Intent / policy</dt><dd className="mt-0.5 font-semibold">{Math.round(result.intentConfidence * 100)}% · {result.policyDecision}</dd></div>
      </dl>

      <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        <Stat label="Categories" value={result.categoriesCreated} />
        <Stat label="Discovered" value={result.productsDiscovered} />
        <Stat label="Rejected" value={result.candidatesRejected} />
        <Stat label="Relevant" value={result.productsRelevant} />
        <Stat label="Imported" value={result.productsImported} />
        <Stat label="Visible" value={result.productsPreviewVisible} />
        <Stat label="Budget" value={`${result.productsImported}/${result.importBudget}`} />
        <Stat label="No media" value={result.productsWithoutMedia} />
        <Stat label="Images" value={mediaCount} />
      </dl>

      {result.previewReady && categoryLinks.length > 0 && (
        <div className="mt-3 text-xs">
          <p className="font-semibold">Categories</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {categoryLinks.map((category) => (
              <a
                key={category.path}
                href={category.path}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white px-2.5 py-1 font-medium capitalize text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                {category.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-3 space-y-1 text-xs">
        <li>
          Store foundation: <strong>{result.foundationStatus}</strong> · admin-only brand,
          design and noindex SEO draft
        </li>
        {result.importQueries.length > 0 && (
          <li className="font-mono text-[11px]">
            queries: {result.importQueries.slice(0, 8).join(" · ")}
          </li>
        )}
        <li>
          Live commerce: <strong>{result.liveCommerceAllowed ? "eligible at product-policy level" : "blocked"}</strong>
          {result.manualReviewRequired ? " · merchant review is still pending" : ""}
        </li>
        {result.plannedDomain ? (
          <li>
            Planned domain: <span className="font-mono">{result.plannedDomain}</span> (not connected
            yet)
          </li>
        ) : (
          <li>No planned production domain is recorded.</li>
        )}
      </ul>

      {result.productsImported === 0 && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">No products were imported</p>
          <p className="mt-1">
            {result.productsDiscovered} candidates were discovered and {result.candidatesRejected}{" "}
            were rejected. No FAQ, guide, collection or visible storefront was approved. Review the
            evidence below before starting a new run.
          </p>
        </div>
      )}

      {result.productsImported > 0 && result.productsPublished === 0 && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">
            No product cleared the preview visibility gates.
          </p>
          <p className="mt-1">
            {result.productsImported} products were imported but none had usable stored media to
            publish. Check supplier results / rejection reasons, then re-run import.
          </p>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.rejectionReasons.length > 0 && (
        <div className="mt-3 rounded-md border border-current/15 bg-white/50 p-3 text-xs">
          <p className="font-semibold">Why candidates were rejected</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.rejectionReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {result.providerAttempts.length > 0 && (
        <details className="mt-3 rounded-md border border-current/15 bg-white/50 p-3 text-xs">
          <summary className="cursor-pointer font-semibold">Provider query attempts ({result.providerAttempts.length})</summary>
          <ul className="mt-2 space-y-1 font-mono text-[11px]">
            {result.providerAttempts.map((attempt, index) => (
              <li key={`${attempt.startedAt}-${index}`}>
                {attempt.providerKey} · {attempt.query} · #{attempt.attempt} {attempt.status} · {attempt.resultCount} results
                {attempt.errorCode ? ` · ${attempt.errorCode}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      {result.products.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Product</th>
                <th className="px-2 py-1.5 font-semibold">Imgs</th>
                <th className="px-2 py-1.5 font-semibold">Vars</th>
                <th className="px-2 py-1.5 font-semibold">Pub</th>
                <th className="px-2 py-1.5 font-semibold">Checkout</th>
                <th className="px-2 py-1.5 font-semibold">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.products.map((product) => (
                <tr key={product.slug}>
                  <td className="px-2 py-1.5">{product.title}</td>
                  <td className="px-2 py-1.5">{product.imageCount}</td>
                  <td className="px-2 py-1.5">{product.variantCount}</td>
                  <td className="px-2 py-1.5">{product.published ? "yes" : "no"}</td>
                  <td className="px-2 py-1.5">{product.checkoutAvailable ? "yes" : "no"}</td>
                  <td className="px-2 py-1.5">
                    {result.previewReady && product.published ? (
                      <a href={product.previewPath} target="_blank" rel="noreferrer" className="font-medium underline hover:text-slate-600">view</a>
                    ) : "blocked"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {result.previewReady && result.previewUrl && (
          <a href={result.previewUrl} target="_blank" rel="noreferrer" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700">Open internal preview</a>
        )}
        {result.storeSlug && (
          <>
        <Link
          href={`/admin/stores/${result.storeSlug}/foundation`}
          className="rounded-md bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800"
        >
          Open Foundation Studio
        </Link>
        <Link
          href={`/admin/stores/${result.storeSlug}/edit`}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Edit store
        </Link>
        <Link
          href={`/admin/stores/${result.storeSlug}/products`}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Manage products
        </Link>
          </>
        )}
      </div>
      {result.previewUrl && <p className="mt-3 font-mono text-[11px] opacity-70">{result.previewUrl}</p>}
    </div>
  );
}

export interface MediaSafetyProps {
  dbIsRemote: boolean;
  effectiveProvider: "local" | "vercel-blob";
  unsafe: boolean;
  overrideEnabled: boolean;
}

function EnvStatusPanel({ safety }: { safety: MediaSafetyProps }) {
  const dbLabel = safety.dbIsRemote ? "remote" : "local";
  const tone = safety.unsafe
    ? "border-red-300 bg-red-50 text-red-950"
    : safety.dbIsRemote && safety.effectiveProvider === "local"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border p-4 text-sm ${tone}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
        <span>
          DB target: <strong className="uppercase">{dbLabel}</strong>
        </span>
        <span>
          Media storage: <strong>{safety.effectiveProvider}</strong>
        </span>
        {safety.overrideEnabled && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">
            ALLOW_REMOTE_DB_LOCAL_MEDIA override ON
          </span>
        )}
      </div>
      {safety.unsafe && (
        <p className="mt-2">
          <strong>Unsafe:</strong> connected to a remote database with local media storage. Store
          creation with supplier-product import is blocked to avoid writing{" "}
          <code>/uploads/dev-media</code> URLs into the remote DB. Turn off product import for a
          structure-only preview, or set{" "}
          <code className="rounded bg-red-100 px-1">MEDIA_STORAGE_PROVIDER=vercel-blob</code> with
          valid Blob authentication.
        </p>
      )}
      {!safety.unsafe && safety.dbIsRemote && safety.effectiveProvider === "local" && (
        <p className="mt-2 text-xs">
          Override active — local media URLs will be written to the remote DB. Run{" "}
          <code>media:repair</code> afterwards.
        </p>
      )}
    </div>
  );
}

export function GeneratorForms({ mediaSafety }: { mediaSafety?: MediaSafetyProps }) {
  const generationKeyRef = useRef(newGenerationKey());
  const preparationEpochRef = useRef(0);
  const [formValues, setFormValues] = useState<BlueprintFormValues>({
    domain: "",
    testOnly: true,
    niche: "",
    targetCustomer: "",
    endUser: "",
    ageRange: "",
    supplierSearchHints: "",
    negativeKeywords: "",
    categoryHints: "",
    pricePositioning: "value",
    productCountGoal: "standard",
    brandVoice: "warm, honest",
    locale: "nb-NO",
    country: "Norway",
  });
  const [blueprintResult, setBlueprintResult] = useState<{
    plan?: StoreBlueprintPreparation;
    error?: string;
  } | null>(null);
  const [launchResult, setLaunchResult] = useState<{
    data?: CreateStoreFromBlueprintResult;
    error?: string;
  } | null>(null);
  const [copyResult, setCopyResult] = useState<{
    copy?: unknown;
    guardrails?: GuardrailReport;
    error?: string;
  } | null>(null);
  const [importProducts, setImportProducts] = useState(true);
  const [autoPublish, setAutoPublish] = useState(true);
  const [useDemoCatalog, setUseDemoCatalog] = useState(false);
  const [isBlueprintPending, startBlueprint] = useTransition();
  const [isClassConfirmPending, startClassConfirm] = useTransition();
  const [isLaunchPending, startLaunch] = useTransition();
  const [isCopyPending, startCopy] = useTransition();

  function handleBlueprintSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: BlueprintFormValues = {
      domain: String(data.get("domain") ?? ""),
      testOnly: data.get("testOnly") === "on",
      niche: String(data.get("niche") ?? ""),
      targetCustomer: String(data.get("targetCustomer") ?? ""),
      endUser: String(data.get("endUser") ?? ""),
      ageRange: String(data.get("ageRange") ?? ""),
      supplierSearchHints: String(data.get("supplierSearchHints") ?? ""),
      negativeKeywords: String(data.get("negativeKeywords") ?? ""),
      categoryHints: String(data.get("categoryHints") ?? ""),
      pricePositioning: String(data.get("pricePositioning") ?? "value"),
      productCountGoal: String(data.get("productCountGoal") ?? "standard"),
      brandVoice: String(data.get("brandVoice") ?? ""),
      locale: String(data.get("locale") ?? ""),
      country: String(data.get("country") ?? ""),
    };
    setFormValues(values);
    // Invalidate the previously approved token immediately. Otherwise the old
    // launch controls remain usable while a same-input re-analysis is pending.
    setBlueprintResult(null);
    setLaunchResult(null);
    generationKeyRef.current = newGenerationKey();
    const requestEpoch = ++preparationEpochRef.current;

    startBlueprint(async () => {
      const result = await generateBlueprintAction(buildBlueprintInput(values));
      if (requestEpoch !== preparationEpochRef.current) return;
      setBlueprintResult(
        result.ok
          ? { plan: result.data }
          : { error: result.error }
      );
    });
  }

  function handleClassConfirmation(acknowledged: boolean) {
    const proposal = blueprintResult?.plan;
    if (
      proposal?.status !== "NEEDS_PRODUCT_CLASS_CONFIRMATION" ||
      isClassConfirmPending
    ) {
      return;
    }
    const requestEpoch = preparationEpochRef.current;
    setLaunchResult(null);
    startClassConfirm(async () => {
      const result = await confirmProductClassAction({
        proposalToken: proposal.proposalToken,
        acknowledged,
      });
      if (requestEpoch !== preparationEpochRef.current) return;
      if (result.ok && result.data?.status === "READY") {
        generationKeyRef.current = newGenerationKey();
      }
      // A transient confirmation/AI failure must not discard the still-valid
      // proposal. Keeping it visible lets the operator inspect and retry it.
      setBlueprintResult(
        result.ok
          ? { plan: result.data }
          : { plan: proposal, error: result.error }
      );
    });
  }

  function handleLaunchStore() {
    const plan = blueprintResult?.plan;
    if (isLaunchPending || plan?.status !== "READY") return;
    const approvedPlanToken = plan.approvedPlanToken;
    const idempotencyKey = generationKeyRef.current;
    const requestedImportProducts = importProducts;
    const requestedAutoPublish = autoPublish;
    const requestedDemoCatalog = useDemoCatalog;
    setLaunchResult(null);
    startLaunch(async () => {
      const result = await createStoreFromBlueprintAction({
        approvedPlanToken,
        importProducts: requestedImportProducts,
        autoPublishScored: requestedAutoPublish,
        idempotencyKey,
        useDemoCatalog: requestedDemoCatalog,
      });
      setLaunchResult(result.ok ? { data: result.data } : { error: result.error });
    });
  }

  function handleCopySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startCopy(async () => {
      const result = await generateProductCopyAction({
        productTitle: String(data.get("productTitle") ?? ""),
        niche: String(data.get("copyNiche") ?? ""),
        audience: String(data.get("copyAudience") ?? ""),
        brandVoice: String(data.get("copyVoice") ?? "") || "clear, honest, practical",
        specs: [],
        shippingDaysMin: Number(data.get("daysMin") ?? 5) || 5,
        shippingDaysMax: Number(data.get("daysMax") ?? 12) || 12,
      });
      setCopyResult(
        result.ok
          ? { copy: result.data?.copy, guardrails: result.data?.guardrails }
          : { error: result.error }
      );
    });
  }

  const preparedPlan =
    blueprintResult?.plan?.status === "READY" ? blueprintResult.plan : null;
  const canLaunch =
    preparedPlan?.guardrails.passed &&
    preparedPlan.approvedPlanToken.length > 0 &&
    preparedPlan.intent.productClass &&
    preparedPlan.queryPlan.queries.length > 0 &&
    !launchResult?.data;

  return (
    <div className="space-y-8">
      {mediaSafety && <EnvStatusPanel safety={mediaSafety} />}

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
        <h2 className="font-bold">Build a catalog hypothesis</h2>
        <p className="mt-1 text-blue-900/90">
          The generator first classifies a product class, then checks supplier evidence and durable
          media. A noindex preview is created only when the minimum catalog passes. Live commerce
          remains a separate, fail-closed approval.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold">1. Describe your store</h2>
          <p className="mt-1 text-sm text-slate-500">
            Input becomes a versioned intent and class-first supplier query plan. Unknown product
            classes stop for review instead of producing generic categories.
          </p>
          <form
            onSubmit={handleBlueprintSubmit}
            onChange={() => {
              preparationEpochRef.current += 1;
              setBlueprintResult(null);
              setLaunchResult(null);
              generationKeyRef.current = newGenerationKey();
            }}
            className="mt-4 grid gap-4 lg:grid-cols-2"
          >
            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="testOnly"
                  defaultChecked={formValues.testOnly}
                  className="rounded border-slate-300"
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, testOnly: event.target.checked }))
                  }
                />
                <span>
                  <strong>No domain yet</strong> — create test preview only (recommended)
                </span>
              </label>
            </div>
            <div className={formValues.testOnly ? "opacity-50 lg:col-span-2" : "lg:col-span-2"}>
              <label htmlFor="gen-domain" className={labelClass}>
                Planned production domain (optional)
              </label>
              <input
                id="gen-domain"
                name="domain"
                disabled={formValues.testOnly}
                className={inputClass}
                placeholder="jaaaws.com"
                defaultValue={formValues.domain}
              />
              <p className="mt-1 text-xs text-slate-500">
                Saved for later — storefront works on preview URL until you connect DNS and mark
                Live.
              </p>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="gen-niche" className={labelClass}>
                Store idea / niche *
              </label>
              <input
                id="gen-niche"
                name="niche"
                required
                className={inputClass}
                placeholder="fish bait · green running shoes · vegan dog toys"
                defaultValue={formValues.niche}
              />
              <p className="mt-1 text-xs text-slate-500">What the store is about.</p>
            </div>
            <div>
              <label htmlFor="gen-target" className={labelClass}>
                Target customer
              </label>
              <input
                id="gen-target"
                name="targetCustomer"
                className={inputClass}
                placeholder="casual anglers · dog owners"
                defaultValue={formValues.targetCustomer}
              />
              <p className="mt-1 text-xs text-slate-500">
                Who buys. Influences tone — not inserted into product titles.
              </p>
            </div>
            <div>
              <label htmlFor="gen-enduser" className={labelClass}>
                End user
              </label>
              <input
                id="gen-enduser"
                name="endUser"
                className={inputClass}
                placeholder="adults · dogs · toddlers"
                defaultValue={formValues.endUser}
              />
              <p className="mt-1 text-xs text-slate-500">
                Only used when it matters for product selection.
              </p>
            </div>
            <div>
              <label htmlFor="gen-age" className={labelClass}>
                Relevant age range
              </label>
              <input
                id="gen-age"
                name="ageRange"
                className={inputClass}
                placeholder="ages 3–6 (kids products only)"
                defaultValue={formValues.ageRange}
              />
              <p className="mt-1 text-xs text-slate-500">
                Only if age is <strong>product-relevant</strong> (e.g. kids toys). Never used for
                buyer demographics.
              </p>
            </div>
            <div>
              <label htmlFor="gen-price" className={labelClass}>
                Price positioning
              </label>
              <select
                id="gen-price"
                name="pricePositioning"
                className={inputClass}
                defaultValue={formValues.pricePositioning}
              >
                <option value="budget">Budget</option>
                <option value="value">Value</option>
                <option value="premium">Premium</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="gen-hints" className={labelClass}>
                Supplier discovery notes
              </label>
              <input
                id="gen-hints"
                name="supplierSearchHints"
                className={inputClass}
                placeholder="fishing lure, soft bait, carp rig"
                defaultValue={formValues.supplierSearchHints}
              />
              <p className="mt-1 text-xs text-slate-500">
                Kept as operator context. Current V3 supplier queries come only from the validated
                product class and cannot be widened by these notes.
              </p>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="gen-negative" className={labelClass}>
                Avoid these products / terms
              </label>
              <input
                id="gen-negative"
                name="negativeKeywords"
                className={inputClass}
                placeholder="toy, doll, aquarium decoration"
                defaultValue={formValues.negativeKeywords}
              />
              <p className="mt-1 text-xs text-slate-500">
                Used to avoid irrelevant supplier matches.
              </p>
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="gen-categoryhints" className={labelClass}>
                Optional creative category ideas
              </label>
              <input
                id="gen-categoryhints"
                name="categoryHints"
                className={inputClass}
                placeholder="leave empty to let AI generate shopper-friendly categories"
                defaultValue={formValues.categoryHints}
              />
              <p className="mt-1 text-xs text-slate-500">
                Creative input only. The persisted catalog category comes from the validated V3
                product class shown below.
              </p>
            </div>
            <div>
              <label htmlFor="gen-count" className={labelClass}>
                Product count goal
              </label>
              <select
                id="gen-count"
                name="productCountGoal"
                className={inputClass}
                defaultValue={formValues.productCountGoal}
              >
                <option value="small">Small catalog (exactly 8)</option>
                <option value="standard">Standard catalog (exactly 12)</option>
                <option value="broad">Broad catalog (24+ later)</option>
              </select>
            </div>
            <div>
              <label htmlFor="gen-voice" className={labelClass}>
                Brand voice
              </label>
              <input
                id="gen-voice"
                name="brandVoice"
                className={inputClass}
                placeholder="warm, honest"
                defaultValue={formValues.brandVoice}
              />
            </div>
            <div>
              <label htmlFor="gen-locale" className={labelClass}>
                Locale
              </label>
              <input
                id="gen-locale"
                name="locale"
                className={inputClass}
                placeholder="nb-NO"
                defaultValue={formValues.locale}
              />
            </div>
            <div>
              <label htmlFor="gen-country" className={labelClass}>
                Country
              </label>
              <input
                id="gen-country"
                name="country"
                className={inputClass}
                placeholder="Norway"
                defaultValue={formValues.country}
              />
            </div>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isBlueprintPending}
                className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isBlueprintPending
                  ? "Analyzing niche…"
                  : "2. Analyze niche & prepare blueprint"}
              </button>
            </div>
          </form>

          {blueprintResult?.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {blueprintResult.error}
            </p>
          )}
          {blueprintResult?.plan && (
            <IntentPlanSummary
              plan={blueprintResult.plan}
              onConfirm={handleClassConfirmation}
              confirming={isClassConfirmPending}
            />
          )}
          {preparedPlan && <GuardrailSummary report={preparedPlan.guardrails} />}
          {preparedPlan && <BlueprintSummary blueprint={preparedPlan.blueprint} />}

          {canLaunch && (
            <div className="mt-6 rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold">3. Run Generator V3</h3>
              <p className="mt-1 text-sm text-slate-600">
                Creates a durable run record and an inactive DRAFT staging tenant. It activates an
                internal noindex preview only after the catalog contract passes.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importProducts}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setImportProducts(enabled);
                      if (!enabled) setUseDemoCatalog(false);
                      setLaunchResult(null);
                      generationKeyRef.current = newGenerationKey();
                    }}
                  />
                  Import supplier products from configured providers
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    disabled={!importProducts}
                    onChange={(event) => {
                      setAutoPublish(event.target.checked);
                      setLaunchResult(null);
                      generationKeyRef.current = newGenerationKey();
                    }}
                  />
                  Make products visible only when every hard preview gate passes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useDemoCatalog}
                    disabled={!importProducts}
                    onChange={(event) => {
                      setUseDemoCatalog(event.target.checked);
                      setLaunchResult(null);
                      generationKeyRef.current = newGenerationKey();
                    }}
                  />
                  Use synthetic demo catalog (local proof only)
                </label>
              </div>
              {useDemoCatalog && importProducts && (
                <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950">
                  Demo mode uses clearly synthetic supplier fixtures. It does not prove real stock,
                  supplier availability, compliance or fulfillment and can never approve live
                  commerce.
                </p>
              )}
              <button
                type="button"
                disabled={isLaunchPending || Boolean(mediaSafety?.unsafe && importProducts)}
                aria-busy={isLaunchPending}
                onClick={handleLaunchStore}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLaunchPending && <span className={inlineSpinnerClass} aria-hidden="true" />}
                {isLaunchPending
                  ? "Generating store…"
                  : importProducts
                    ? "Run catalog generation"
                    : "Create inactive structure-only DRAFT"}
              </button>

              {mediaSafety?.unsafe && importProducts && (
                <p className="mt-2 text-xs font-medium text-red-700">
                  Product import is blocked: remote database + local media storage. Turn off
                  product import for a structure-only preview, or configure durable Blob storage.
                </p>
              )}
              {mediaSafety?.unsafe && !importProducts && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  Safe structure-only mode: no supplier media will be written. Products can be
                  imported later after durable media storage is configured.
                </p>
              )}

              {isLaunchPending && <GenerationProgress />}
            </div>
          )}

          {launchResult?.error && (
            <LaunchFailure
              error={launchResult.error}
              onRetry={handleLaunchStore}
              retrying={isLaunchPending}
            />
          )}
          {launchResult?.data && <LaunchSuccess result={launchResult.data} />}

          {blueprintResult?.plan && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600">
                Raw prepared-plan JSON
              </summary>
              <JsonPreview value={blueprintResult.plan} />
            </details>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Product copy generator</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate honest product descriptions for manual edits or supplier imports.
          </p>
          <form onSubmit={handleCopySubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="copy-title" className={labelClass}>
                Product title
              </label>
              <input
                id="copy-title"
                name="productTitle"
                required
                className={inputClass}
                placeholder="Foldable 4K Camera Drone"
              />
            </div>
            <div>
              <label htmlFor="copy-niche" className={labelClass}>
                Niche
              </label>
              <input
                id="copy-niche"
                name="copyNiche"
                required
                className={inputClass}
                placeholder="consumer drones"
              />
            </div>
            <div>
              <label htmlFor="copy-audience" className={labelClass}>
                Audience
              </label>
              <input
                id="copy-audience"
                name="copyAudience"
                required
                className={inputClass}
                placeholder="hobby pilots"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="copy-voice" className={labelClass}>
                  Brand voice
                </label>
                <input
                  id="copy-voice"
                  name="copyVoice"
                  className={inputClass}
                  placeholder="technical"
                />
              </div>
              <div>
                <label htmlFor="copy-daysmin" className={labelClass}>
                  Ship min
                </label>
                <input
                  id="copy-daysmin"
                  name="daysMin"
                  type="number"
                  min={1}
                  defaultValue={5}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="copy-daysmax" className={labelClass}>
                  Ship max
                </label>
                <input
                  id="copy-daysmax"
                  name="daysMax"
                  type="number"
                  min={1}
                  defaultValue={12}
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isCopyPending}
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isCopyPending ? "Generating…" : "Generate copy"}
            </button>
          </form>
          {copyResult?.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {copyResult.error}
            </p>
          )}
          {copyResult?.guardrails && <GuardrailSummary report={copyResult.guardrails} />}
          {copyResult?.copy !== undefined && <JsonPreview value={copyResult.copy} />}
        </section>
      </div>
    </div>
  );
}
