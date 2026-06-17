"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { StoreBlueprint } from "@/lib/ai/types";
import type { GuardrailReport } from "@/lib/ai/content-guardrails";
import {
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
  "Creating the store blueprint",
  "Building categories and content",
  "Searching supplier products",
  "Fetching product details",
  "Importing product media",
  "Creating product pages and variants",
  "Preparing preview links",
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

function LaunchFailure({ error }: { error: string }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-950"
    >
      <p className="text-base font-bold">Generation failed</p>
      <p className="mt-1 font-mono text-xs text-red-800">{error}</p>
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
    </div>
  );
}

interface BlueprintFormValues {
  domain: string;
  testOnly: boolean;
  niche: string;
  audience: string;
  keywords: string;
  brandVoice: string;
  locale: string;
  country: string;
}

function buildBlueprintInput(values: BlueprintFormValues) {
  return {
    domain: values.testOnly ? undefined : values.domain || undefined,
    niche: values.niche,
    audience: values.audience,
    productKeywords: values.keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    brandVoice: values.brandVoice || "clear, honest, practical",
    locale: values.locale || "en-US",
    country: values.country || "United States",
  };
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
          <dt className="font-medium text-slate-800">Categories</dt>
          <dd>{blueprint.categories.map((category) => category.name).join(", ")}</dd>
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

function LaunchSuccess({ result }: { result: CreateStoreFromBlueprintResult }) {
  const mediaCount = result.products.reduce((total, product) => total + product.imageCount, 0);
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
      <p className="text-lg font-bold">Store created — preview ready</p>
      <p className="mt-1">
        <strong>{result.storeName}</strong> is live in <strong>Preview</strong> mode (noindex until
        you connect a production domain).
      </p>
      <ul className="mt-3 space-y-1 text-xs">
        <li>
          {result.categoriesCreated} categories · {result.productsDiscovered} discovered ·{" "}
          {result.candidatesRejected} rejected · {result.productsImported} imported ·{" "}
          {result.productsPublished} published · {mediaCount} images · {result.guidesCreated} guide
        </li>
        {result.plannedDomain ? (
          <li>
            Planned domain: <span className="font-mono">{result.plannedDomain}</span> (not connected
            yet)
          </li>
        ) : (
          <li>No planned domain yet — using test preview URLs only</li>
        )}
      </ul>

      {result.productsImported === 0 && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">No products were imported</p>
          <p className="mt-1">
            {result.productsDiscovered} candidates were discovered and {result.candidatesRejected}{" "}
            were rejected. The store, categories and content were still created — review the
            rejection reasons below or try a broader/more specific niche query, then re-run import.
          </p>
        </div>
      )}

      {result.productsImported > 0 && result.productsPublished === 0 && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">
            Store was created, but no products were published.
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
        <div className="mt-3 rounded-md bg-emerald-100/60 p-3 text-xs">
          <p className="font-semibold">Why candidates were rejected</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {result.rejectionReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-1 text-emerald-800">
            Tip: if many were rejected, try a broader or more specific product query for this niche.
          </p>
        </div>
      )}

      {result.products.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-md border border-emerald-200 bg-white">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-emerald-100 text-emerald-900">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Product</th>
                <th className="px-2 py-1.5 font-semibold">Imgs</th>
                <th className="px-2 py-1.5 font-semibold">Vars</th>
                <th className="px-2 py-1.5 font-semibold">Pub</th>
                <th className="px-2 py-1.5 font-semibold">Checkout</th>
                <th className="px-2 py-1.5 font-semibold">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 text-emerald-950">
              {result.products.map((product) => (
                <tr key={product.slug}>
                  <td className="px-2 py-1.5">{product.title}</td>
                  <td className="px-2 py-1.5">{product.imageCount}</td>
                  <td className="px-2 py-1.5">{product.variantCount}</td>
                  <td className="px-2 py-1.5">{product.published ? "yes" : "no"}</td>
                  <td className="px-2 py-1.5">{product.checkoutAvailable ? "yes" : "no"}</td>
                  <td className="px-2 py-1.5">
                    <a
                      href={product.previewPath}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline hover:text-emerald-700"
                    >
                      view
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={result.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-emerald-800 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          Open preview storefront
        </a>
        <Link
          href={`/admin/stores/${result.storeSlug}/edit`}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-100"
        >
          Edit store
        </Link>
        <Link
          href={`/admin/stores/${result.storeSlug}/products`}
          className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-100"
        >
          Manage products
        </Link>
      </div>
      <p className="mt-3 font-mono text-[11px] text-emerald-800">{result.previewUrl}</p>
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
          creation is blocked to avoid writing <code>/uploads/dev-media</code> URLs into the remote
          DB. Set <code className="rounded bg-red-100 px-1">MEDIA_STORAGE_PROVIDER=vercel-blob</code>{" "}
          (with a Blob token) or generate from the deployed admin.
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
  const [formValues, setFormValues] = useState<BlueprintFormValues>({
    domain: "",
    testOnly: true,
    niche: "",
    audience: "",
    keywords: "",
    brandVoice: "warm, honest",
    locale: "nb-NO",
    country: "Norway",
  });
  const [blueprintResult, setBlueprintResult] = useState<{
    blueprint?: StoreBlueprint;
    guardrails?: GuardrailReport;
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
  const [isBlueprintPending, startBlueprint] = useTransition();
  const [isLaunchPending, startLaunch] = useTransition();
  const [isCopyPending, startCopy] = useTransition();

  function handleBlueprintSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: BlueprintFormValues = {
      domain: String(data.get("domain") ?? ""),
      testOnly: data.get("testOnly") === "on",
      niche: String(data.get("niche") ?? ""),
      audience: String(data.get("audience") ?? ""),
      keywords: String(data.get("keywords") ?? ""),
      brandVoice: String(data.get("brandVoice") ?? ""),
      locale: String(data.get("locale") ?? ""),
      country: String(data.get("country") ?? ""),
    };
    setFormValues(values);
    setLaunchResult(null);

    startBlueprint(async () => {
      const result = await generateBlueprintAction(buildBlueprintInput(values));
      setBlueprintResult(
        result.ok
          ? { blueprint: result.data?.blueprint, guardrails: result.data?.guardrails }
          : { error: result.error }
      );
    });
  }

  function handleLaunchStore() {
    if (isLaunchPending) return;
    setLaunchResult(null);
    startLaunch(async () => {
      const result = await createStoreFromBlueprintAction({
        blueprintInput: buildBlueprintInput(formValues),
        importProducts,
        autoPublishScored: autoPublish,
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

  const canLaunch =
    blueprintResult?.blueprint &&
    blueprintResult.guardrails?.passed &&
    !launchResult?.data;

  return (
    <div className="space-y-8">
      {mediaSafety && <EnvStatusPanel safety={mediaSafety} />}

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
        <h2 className="font-bold">Launch a new store in minutes</h2>
        <p className="mt-1 text-blue-900/90">
          Fill in your niche and audience. You do <strong>not</strong> need a real domain yet — we
          create a <strong>Preview</strong> store on this deployment (noindex) at{" "}
          <code className="rounded bg-white/70 px-1">/s/your-slug</code>. Add your planned domain
          when ready, then mark the store Live after DNS is connected.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold">1. Describe your store</h2>
          <p className="mt-1 text-sm text-slate-500">
            Minimal input → full blueprint with categories, SEO, theme, trust copy and import
            queries.
          </p>
          <form onSubmit={handleBlueprintSubmit} className="mt-4 grid gap-4 lg:grid-cols-2">
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
            <div>
              <label htmlFor="gen-niche" className={labelClass}>
                Niche *
              </label>
              <input
                id="gen-niche"
                name="niche"
                required
                className={inputClass}
                placeholder="jaw relaxation gummies"
                defaultValue={formValues.niche}
              />
            </div>
            <div>
              <label htmlFor="gen-audience" className={labelClass}>
                Audience *
              </label>
              <input
                id="gen-audience"
                name="audience"
                required
                className={inputClass}
                placeholder="young adults 18–45"
                defaultValue={formValues.audience}
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="gen-keywords" className={labelClass}>
                Product keywords (comma-separated)
              </label>
              <input
                id="gen-keywords"
                name="keywords"
                className={inputClass}
                placeholder="gummy, jaw relief, stress chew"
                defaultValue={formValues.keywords}
              />
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
                {isBlueprintPending ? "Generating blueprint…" : "2. Generate blueprint"}
              </button>
            </div>
          </form>

          {blueprintResult?.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {blueprintResult.error}
            </p>
          )}
          {blueprintResult?.guardrails && (
            <GuardrailSummary report={blueprintResult.guardrails} />
          )}
          {blueprintResult?.blueprint && (
            <BlueprintSummary blueprint={blueprintResult.blueprint} />
          )}

          {canLaunch && (
            <div className="mt-6 rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold">3. Create store in database</h3>
              <p className="mt-1 text-sm text-slate-600">
                Builds the tenant with theme, categories, configured supplier products, FAQ and a
                starter guide. Preview mode = noindex until you go Live.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={importProducts}
                    onChange={(event) => setImportProducts(event.target.checked)}
                  />
                  Import supplier products from configured providers
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(event) => setAutoPublish(event.target.checked)}
                  />
                  Auto-publish high-scoring imports
                </label>
              </div>
              <button
                type="button"
                disabled={isLaunchPending || Boolean(mediaSafety?.unsafe)}
                aria-busy={isLaunchPending}
                onClick={handleLaunchStore}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLaunchPending && <span className={inlineSpinnerClass} aria-hidden="true" />}
                {isLaunchPending ? "Generating store…" : "Create store & open preview"}
              </button>

              {mediaSafety?.unsafe && (
                <p className="mt-2 text-xs font-medium text-red-700">
                  Blocked: remote database + local media storage. See the status panel above.
                </p>
              )}

              {isLaunchPending && <GenerationProgress />}
            </div>
          )}

          {launchResult?.error && <LaunchFailure error={launchResult.error} />}
          {launchResult?.data && <LaunchSuccess result={launchResult.data} />}

          {blueprintResult?.blueprint && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600">
                Raw blueprint JSON
              </summary>
              <JsonPreview value={blueprintResult.blueprint} />
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
