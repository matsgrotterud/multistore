"use client";

import { useActionState, useState } from "react";
import type { CSSProperties } from "react";
import { updateStoreAction, type AdminActionState } from "@/lib/actions/admin-store";
import {
  CheckboxField,
  Field,
  FormSection,
  NumberField,
  SelectField,
  TextField,
  TextareaField,
  inputClass,
  labelClass,
} from "@/components/admin/fields";
import { buildThemeStyle } from "@/lib/theme";
import { HERO_VARIANT_OPTIONS, type StoreSettings } from "@/lib/settings/store-settings";

export interface StoreEditFormProps {
  slug: string;
  store: {
    name: string;
    legalName: string;
    primaryDomain: string;
    locale: string;
    currency: string;
    niche: string;
    positioning: string;
    audience: string;
    valueProposition: string;
    brandVoice: string;
    logoText: string;
    supportEmail: string;
    supportPhone: string | null;
    shippingOriginDisclosure: string;
    defaultShippingDaysMin: number;
    defaultShippingDaysMax: number;
    returnPolicySummary: string;
    privacyPolicy: string;
    termsOfSale: string;
    isActive: boolean;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontHeading: string;
    fontBody: string;
  };
  domains: string[];
  settings: StoreSettings;
}

const FONT_OPTIONS = [
  { value: "system-ui", label: "System UI" },
  { value: "serif", label: "Serif" },
  { value: "rounded", label: "Rounded" },
  { value: "mono", label: "Monospace" },
  { value: "humanist", label: "Humanist" },
  { value: "geometric", label: "Geometric" },
];

const initialState: AdminActionState = { ok: false, error: null };

function ColorInput({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={name}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded border border-slate-300"
        />
        <input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} font-mono`}
        />
      </div>
    </Field>
  );
}

export function StoreEditForm({ slug, store, theme, domains, settings }: StoreEditFormProps) {
  const [state, formAction, isPending] = useActionState(updateStoreAction, initialState);

  const [colors, setColors] = useState({
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
  });
  const setColor = (key: keyof typeof colors) => (value: string) =>
    setColors((current) => ({ ...current, [key]: value }));

  const previewStyle = buildThemeStyle({
    id: "preview",
    storeId: "preview",
    ...colors,
    borderRadius: theme.borderRadius,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
  }) as CSSProperties;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      <FormSection title="Brand & identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="name" label="Store name" defaultValue={store.name} required />
          <TextField name="legalName" label="Legal name" defaultValue={store.legalName} required />
          <TextField name="logoText" label="Logo text" defaultValue={store.logoText} required />
          <TextField name="niche" label="Niche" defaultValue={store.niche} required />
        </div>
        <TextField name="positioning" label="Positioning" defaultValue={store.positioning} required />
        <TextField name="audience" label="Audience" defaultValue={store.audience} required />
        <TextareaField
          name="valueProposition"
          label="Value proposition"
          defaultValue={store.valueProposition}
          rows={2}
        />
        <TextField name="brandVoice" label="Brand voice" defaultValue={store.brandVoice} required />
      </FormSection>

      <FormSection
        title="Domains & locale"
        description="Canonical URLs always use the primary domain — never the /s/ path."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="primaryDomain"
            label="Primary domain"
            defaultValue={store.primaryDomain}
            required
            hint="e.g. dronehub.example"
          />
          <TextField name="locale" label="Locale" defaultValue={store.locale} required hint="e.g. en-US" />
          <TextField name="currency" label="Currency" defaultValue={store.currency} required hint="ISO 4217, e.g. USD" />
        </div>
        <TextareaField
          name="domains"
          label="Additional domains"
          defaultValue={domains.filter((host) => host !== store.primaryDomain).join("\n")}
          rows={3}
          hint="One hostname per line. The primary domain is added automatically."
        />
        <CheckboxField
          name="isActive"
          label="Store is active"
          defaultChecked={store.isActive}
          hint="Inactive stores stop resolving on their domains and disappear from sitemaps."
        />
      </FormSection>

      <FormSection title="Support & shipping">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="supportEmail" label="Support email" type="email" defaultValue={store.supportEmail} required />
          <TextField name="supportPhone" label="Support phone" defaultValue={store.supportPhone} />
          <NumberField name="defaultShippingDaysMin" label="Default shipping days (min)" defaultValue={store.defaultShippingDaysMin} min={1} />
          <NumberField name="defaultShippingDaysMax" label="Default shipping days (max)" defaultValue={store.defaultShippingDaysMax} min={1} />
        </div>
        <TextareaField
          name="shippingOriginDisclosure"
          label="Shipping origin disclosure"
          defaultValue={store.shippingOriginDisclosure}
          rows={2}
          hint="Honest disclosure of where orders ship from and expected transit time."
        />
      </FormSection>

      <FormSection title="Policies">
        <TextareaField name="returnPolicySummary" label="Return policy summary" defaultValue={store.returnPolicySummary} rows={2} />
        <TextareaField name="privacyPolicy" label="Privacy policy" defaultValue={store.privacyPolicy} rows={5} />
        <TextareaField name="termsOfSale" label="Terms of sale" defaultValue={store.termsOfSale} rows={5} />
      </FormSection>

      <FormSection title="Theme" description="Changes preview live; save to apply to the storefront.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ColorInput name="primaryColor" label="Primary" value={colors.primaryColor} onChange={setColor("primaryColor")} />
            <ColorInput name="secondaryColor" label="Secondary" value={colors.secondaryColor} onChange={setColor("secondaryColor")} />
            <ColorInput name="accentColor" label="Accent" value={colors.accentColor} onChange={setColor("accentColor")} />
            <ColorInput name="backgroundColor" label="Background" value={colors.backgroundColor} onChange={setColor("backgroundColor")} />
            <ColorInput name="textColor" label="Text" value={colors.textColor} onChange={setColor("textColor")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField name="borderRadius" label="Border radius" defaultValue={theme.borderRadius} hint="e.g. 0.75rem" />
              <SelectField name="fontHeading" label="Heading font" options={FONT_OPTIONS} defaultValue={theme.fontHeading} />
              <SelectField name="fontBody" label="Body font" options={FONT_OPTIONS} defaultValue={theme.fontBody} />
            </div>
          </div>
          <div>
            <span className={labelClass}>Live preview</span>
            <div style={previewStyle} className="overflow-hidden rounded-theme border border-slate-200 bg-surface font-body text-ink">
              <div className="flex items-center justify-between bg-secondary px-4 py-3 text-white">
                <span className="font-heading text-sm font-bold">{store.logoText || "Logo"}</span>
                <span className="rounded-theme bg-accent px-2 py-1 text-xs font-semibold text-black/80">Cart</span>
              </div>
              <div className="p-4">
                <h3 className="font-heading text-lg font-bold">{store.name || "Store name"}</h3>
                <p className="mt-1 text-sm opacity-80">{store.valueProposition || "Value proposition preview"}</p>
                <button type="button" className="mt-3 rounded-theme bg-primary px-3 py-2 text-sm font-semibold text-white">
                  Shop now
                </button>
                <div className="mt-4 rounded-theme bg-primary-soft p-3 text-xs">
                  Soft accent surface · radius {theme.borderRadius}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <SettingsFields settings={settings} />

      <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save store"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="text-sm font-medium text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}

function SettingsFields({ settings }: { settings: StoreSettings }) {
  return (
    <>
      <FormSection title="SEO defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="s_seo_defaultOgImage" label="Default OG image URL" defaultValue={settings.seo.defaultOgImage} />
          <TextField name="s_seo_googleSiteVerification" label="Google site verification" defaultValue={settings.seo.googleSiteVerification} />
        </div>
        <TextareaField name="s_seo_robotsExtraDisallow" label="Robots extra disallow" defaultValue={settings.seo.robotsExtraDisallow.join("\n")} rows={2} hint="One path per line." />
        <TextField name="s_seo_hreflangLocales" label="Hreflang locales" defaultValue={settings.seo.hreflangLocales.join(", ")} hint="Comma-separated, e.g. en-US, en-GB" />
      </FormSection>

      <FormSection title="Homepage">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="s_home_heroVariant" label="Hero variant" options={HERO_VARIANT_OPTIONS} defaultValue={settings.homepage.heroVariant} />
          <TextField name="s_home_featuredCollectionSlug" label="Featured collection slug" defaultValue={settings.homepage.featuredCollectionSlug} />
        </div>
        <TextareaField name="s_home_trustBarItems" label="Trust bar items" defaultValue={settings.homepage.trustBarItems.join("\n")} rows={3} hint="One claim per line." />
        <div className="grid gap-1 sm:grid-cols-2">
          <CheckboxField name="s_home_showQuizCta" label="Show quiz CTA" defaultChecked={settings.homepage.showQuizCta} />
          <CheckboxField name="s_home_showComparisonCta" label="Show comparison CTA" defaultChecked={settings.homepage.showComparisonCta} />
        </div>
      </FormSection>

      <FormSection title="Monetization">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField name="s_mon_targetMarginPercent" label="Target margin %" defaultValue={settings.monetization.targetMarginPercent} min={0} max={95} />
          <NumberField name="s_mon_minMarginPercent" label="Min margin %" defaultValue={settings.monetization.minMarginPercent} min={0} max={95} />
          <NumberField name="s_mon_bundleDiscountPercent" label="Bundle discount %" defaultValue={settings.monetization.bundleDiscountPercent} min={0} max={90} />
        </div>
        <TextField name="s_mon_subscriptionSkus" label="Subscription SKUs" defaultValue={settings.monetization.subscriptionSkus.join(", ")} hint="Comma-separated SKUs offered as subscriptions." />
        <CheckboxField name="s_mon_enableCompareAtPrice" label="Enable compare-at price" defaultChecked={settings.monetization.enableCompareAtPrice} hint="Only honest anchor prices are ever shown (see pricing rules)." />
      </FormSection>

      <FormSection title="Marketing">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField name="s_mkt_metaPixelId" label="Meta Pixel ID" defaultValue={settings.marketing.metaPixelId} />
          <TextField name="s_mkt_googleAdsId" label="Google Ads ID" defaultValue={settings.marketing.googleAdsId} />
          <TextField name="s_mkt_utmDefaultSource" label="Default UTM source" defaultValue={settings.marketing.utmDefaultSource} />
        </div>
      </FormSection>

      <FormSection title="Personalization">
        <CheckboxField name="s_per_enabled" label="Enable personalization" defaultChecked={settings.personalization.enabled} hint="Recommendations only run with analytics consent." />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField name="s_per_quizWeight" label="Quiz weight" defaultValue={settings.personalization.quizWeight} min={0} max={10} step={0.5} />
          <NumberField name="s_per_browseHistoryWeight" label="Browse history weight" defaultValue={settings.personalization.browseHistoryWeight} min={0} max={10} step={0.5} />
        </div>
      </FormSection>

      <FormSection title="Automation">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField name="s_auto_autoPublishMinScore" label="Auto-publish min score" defaultValue={settings.automation.autoPublishMinScore} min={0} max={100} hint="Imported products at/above this score publish automatically." />
          <NumberField name="s_auto_autoNoindexBelowScore" label="Auto-noindex below score" defaultValue={settings.automation.autoNoindexBelowScore} min={0} max={100} hint="Weak products get noindex until improved." />
          <TextField name="s_auto_importDefaultSupplier" label="Default import supplier" defaultValue={settings.automation.importDefaultSupplier} />
          <TextField name="s_auto_importKeywords" label="Import keywords" defaultValue={settings.automation.importKeywords.join(", ")} hint="Comma-separated seed keywords." />
        </div>
      </FormSection>

      <FormSection title="Compliance">
        <CheckboxField name="s_comp_showDropshipDisclosure" label="Show dropship disclosure" defaultChecked={settings.compliance.showDropshipDisclosure} />
        <TextareaField name="s_comp_importTaxDisclaimer" label="Import tax disclaimer" defaultValue={settings.compliance.importTaxDisclaimer} rows={2} />
        <TextField name="s_comp_cookiePolicyUrl" label="Cookie policy URL" defaultValue={settings.compliance.cookiePolicyUrl} />
      </FormSection>
    </>
  );
}
