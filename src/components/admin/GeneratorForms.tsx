"use client";

import { useState, useTransition } from "react";
import {
  generateBlueprintAction,
  generateProductCopyAction,
} from "@/lib/actions/generator";
import type { GuardrailReport } from "@/lib/ai/content-guardrails";

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

export function GeneratorForms() {
  const [blueprintResult, setBlueprintResult] = useState<{
    blueprint?: unknown;
    guardrails?: GuardrailReport;
    error?: string;
  } | null>(null);
  const [copyResult, setCopyResult] = useState<{
    copy?: unknown;
    guardrails?: GuardrailReport;
    error?: string;
  } | null>(null);
  const [isBlueprintPending, startBlueprint] = useTransition();
  const [isCopyPending, startCopy] = useTransition();

  function handleBlueprintSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startBlueprint(async () => {
      const result = await generateBlueprintAction({
        domain: String(data.get("domain") ?? ""),
        niche: String(data.get("niche") ?? ""),
        audience: String(data.get("audience") ?? ""),
        productKeywords: String(data.get("keywords") ?? "")
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
        brandVoice: String(data.get("brandVoice") ?? "") || "clear, honest, practical",
        locale: String(data.get("locale") ?? "") || "en-US",
        country: String(data.get("country") ?? "") || "United States",
      });
      setBlueprintResult(
        result.ok
          ? { blueprint: result.data?.blueprint, guardrails: result.data?.guardrails }
          : { error: result.error }
      );
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

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Store blueprint */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Generate store blueprint</h2>
        <form onSubmit={handleBlueprintSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="gen-domain" className={labelClass}>
              Domain
            </label>
            <input id="gen-domain" name="domain" required className={inputClass} placeholder="espressohjem.example" />
          </div>
          <div>
            <label htmlFor="gen-niche" className={labelClass}>
              Niche
            </label>
            <input id="gen-niche" name="niche" required className={inputClass} placeholder="home espresso gear" />
          </div>
          <div>
            <label htmlFor="gen-audience" className={labelClass}>
              Audience
            </label>
            <input id="gen-audience" name="audience" required className={inputClass} placeholder="home baristas upgrading from capsule machines" />
          </div>
          <div>
            <label htmlFor="gen-keywords" className={labelClass}>
              Product/supplier keywords (comma-separated)
            </label>
            <input id="gen-keywords" name="keywords" className={inputClass} placeholder="espresso grinder, milk frother, tamper" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="gen-voice" className={labelClass}>
                Brand voice
              </label>
              <input id="gen-voice" name="brandVoice" className={inputClass} placeholder="warm, precise" />
            </div>
            <div>
              <label htmlFor="gen-locale" className={labelClass}>
                Locale
              </label>
              <input id="gen-locale" name="locale" className={inputClass} placeholder="en-US" />
            </div>
            <div>
              <label htmlFor="gen-country" className={labelClass}>
                Country
              </label>
              <input id="gen-country" name="country" className={inputClass} placeholder="United States" />
            </div>
          </div>
          <button
            type="submit"
            disabled={isBlueprintPending}
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isBlueprintPending ? "Generating…" : "Generate blueprint"}
          </button>
        </form>
        {blueprintResult?.error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {blueprintResult.error}
          </p>
        )}
        {blueprintResult?.guardrails && (
          <GuardrailSummary report={blueprintResult.guardrails} />
        )}
        {blueprintResult?.blueprint !== undefined && (
          <JsonPreview value={blueprintResult.blueprint} />
        )}
      </section>

      {/* Product copy */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Generate product copy</h2>
        <form onSubmit={handleCopySubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="copy-title" className={labelClass}>
              Product title
            </label>
            <input id="copy-title" name="productTitle" required className={inputClass} placeholder="Foldable 4K Camera Drone" />
          </div>
          <div>
            <label htmlFor="copy-niche" className={labelClass}>
              Niche
            </label>
            <input id="copy-niche" name="copyNiche" required className={inputClass} placeholder="consumer drones" />
          </div>
          <div>
            <label htmlFor="copy-audience" className={labelClass}>
              Audience
            </label>
            <input id="copy-audience" name="copyAudience" required className={inputClass} placeholder="hobby pilots" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="copy-voice" className={labelClass}>
                Brand voice
              </label>
              <input id="copy-voice" name="copyVoice" className={inputClass} placeholder="technical, direct" />
            </div>
            <div>
              <label htmlFor="copy-daysmin" className={labelClass}>
                Ship days min
              </label>
              <input id="copy-daysmin" name="daysMin" type="number" min={1} defaultValue={5} className={inputClass} />
            </div>
            <div>
              <label htmlFor="copy-daysmax" className={labelClass}>
                Ship days max
              </label>
              <input id="copy-daysmax" name="daysMax" type="number" min={1} defaultValue={12} className={inputClass} />
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
  );
}
