"use client";

import { useActionState, useState } from "react";
import {
  updateStorePresentationAction,
  type PresentationActionState,
} from "@/lib/actions/admin-store-presentation";
import {
  OPTIONAL_STOREFRONT_SECTION_IDS,
  STOREFRONT_ARCHETYPES,
  STOREFRONT_DENSITIES,
  STOREFRONT_HERO_COMPOSITIONS,
  presentationForArchetype,
  type OptionalStorefrontSectionId,
  type StorefrontArchetype,
  type StorefrontDensity,
  type StorefrontHeroComposition,
  type StorefrontPresentationV1,
} from "@/lib/storefront/presentation";

const initialState: PresentationActionState = { ok: false, error: null };

const ARCHETYPE_COPY: Record<
  StorefrontArchetype,
  { label: string; description: string; mood: string }
> = {
  classic: {
    label: "Classic",
    description: "Compatibility layout for existing stores.",
    mood: "Clear · familiar · balanced",
  },
  editorial: {
    label: "Editorial",
    description: "Image-led, premium and deliberately spacious.",
    mood: "Premium · expressive · curated",
  },
  technical: {
    label: "Technical",
    description: "Precise geometry and product-first information density.",
    mood: "Exact · capable · high-spec",
  },
  playful: {
    label: "Playful",
    description: "Rounded, energetic and friendly without fake claims.",
    mood: "Bright · social · approachable",
  },
  rugged: {
    label: "Rugged",
    description: "Strong contrast and an outdoor, utilitarian rhythm.",
    mood: "Durable · direct · adventurous",
  },
  soft: {
    label: "Soft lifestyle",
    description: "Calm, tactile and comfort-oriented presentation.",
    mood: "Warm · gentle · considered",
  },
  minimal: {
    label: "Minimal",
    description: "Quiet surfaces, restrained cards and generous whitespace.",
    mood: "Clean · modern · focused",
  },
};

function PreviewCard({
  archetype,
  selected,
  onSelect,
}: {
  archetype: StorefrontArchetype;
  selected: boolean;
  onSelect: () => void;
}) {
  const copy = ARCHETYPE_COPY[archetype];
  const shapeClass =
    archetype === "playful" || archetype === "soft"
      ? "rounded-[1.4rem]"
      : archetype === "editorial" || archetype === "minimal"
        ? "rounded-none"
        : "rounded-md";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left transition ${shapeClass} border p-4 ${
        selected
          ? "border-slate-900 bg-slate-950 text-white shadow-xl"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
      }`}
    >
      <div
        aria-hidden="true"
        className={`mb-4 grid h-24 grid-cols-5 gap-1 overflow-hidden ${shapeClass} ${
          archetype === "technical"
            ? "bg-slate-900 p-2"
            : archetype === "rugged"
              ? "bg-amber-950 p-2"
              : archetype === "soft"
                ? "bg-rose-50 p-2"
                : archetype === "playful"
                  ? "bg-violet-100 p-2"
                  : archetype === "minimal"
                    ? "bg-stone-50 p-3"
                    : "bg-slate-100 p-2"
        }`}
      >
        <span className="col-span-3 rounded-sm bg-current opacity-15" />
        <span className="col-span-2 rounded-sm bg-current opacity-35" />
      </div>
      <p className="font-semibold">{copy.label}</p>
      <p className={`mt-1 text-xs leading-5 ${selected ? "text-white/70" : "text-slate-500"}`}>
        {copy.description}
      </p>
      <p className={`mt-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${selected ? "text-white/55" : "text-slate-400"}`}>
        {copy.mood}
      </p>
    </button>
  );
}

export function StorefrontDesignForm({
  slug,
  storeName,
  current,
  recommended,
  isExplicit,
}: {
  slug: string;
  storeName: string;
  current: StorefrontPresentationV1;
  recommended: StorefrontPresentationV1;
  isExplicit: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateStorePresentationAction,
    initialState
  );
  const [design, setDesign] = useState(current);

  function applyPreset(archetype: StorefrontArchetype) {
    setDesign(presentationForArchetype(archetype));
  }

  function toggleSection(section: OptionalStorefrontSectionId, visible: boolean) {
    setDesign((value) => ({
      ...value,
      hiddenSections: visible
        ? value.hiddenSections.filter((entry) => entry !== section)
        : Array.from(new Set([...value.hiddenSections, section])),
    }));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="archetype" value={design.archetype} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Storefront Presentation V1
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Choose the art direction</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Presets change presentation only. Catalog visibility, checkout, policies and SEO evidence remain untouched.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDesign(recommended)}
            className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
          >
            Apply recommended: {ARCHETYPE_COPY[recommended.archetype].label}
          </button>
        </div>

        {!isExplicit && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            {storeName} currently uses the untouched compatibility design. Saving here explicitly opts this store into Presentation V1.
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STOREFRONT_ARCHETYPES.map((archetype) => (
            <PreviewCard
              key={archetype}
              archetype={archetype}
              selected={design.archetype === archetype}
              onSelect={() => applyPreset(archetype)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">Composition</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Density
            <select
              name="density"
              value={design.density}
              onChange={(event) =>
                setDesign((value) => ({
                  ...value,
                  density: event.target.value as StorefrontDensity,
                }))
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            >
              {STOREFRONT_DENSITIES.map((density) => (
                <option key={density} value={density}>{density}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hero composition
            <select
              name="hero"
              value={design.hero}
              onChange={(event) =>
                setDesign((value) => ({
                  ...value,
                  hero: event.target.value as StorefrontHeroComposition,
                }))
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            >
              {STOREFRONT_HERO_COMPOSITIONS.map((hero) => (
                <option key={hero} value={hero}>{hero}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          Homepage order
          <textarea
            name="sectionOrder"
            value={design.sectionOrder.join("\n")}
            onChange={(event) =>
              setDesign((value) => ({
                ...value,
                sectionOrder: event.target.value
                  .split("\n")
                  .map((entry) => entry.trim())
                  .filter(Boolean) as StorefrontPresentationV1["sectionOrder"],
              }))
            }
            rows={7}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm"
          />
          <span className="mt-1 block text-xs text-slate-500">
            One allowlisted section per line. Featured products are mandatory and restored automatically.
          </span>
        </label>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-slate-700">Visible optional sections</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPTIONAL_STOREFRONT_SECTION_IDS.map((section) => {
              const visible = !design.hiddenSections.includes(section);
              return (
                <label key={section} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name={`show_${section}`}
                    checked={visible}
                    onChange={(event) => toggleSection(section, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {section}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-5 py-4 shadow-xl backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save storefront design"}
        </button>
        <a
          href={`/s/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          Open storefront
        </a>
        {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
        {state.ok && state.message && <p className="text-sm font-medium text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}

