/** Map generator country input to store locale + currency defaults. */

const COUNTRY_DEFAULTS: Record<string, { locale: string; currency: string }> = {
  norway: { locale: "nb-NO", currency: "NOK" },
  norge: { locale: "nb-NO", currency: "NOK" },
  "united states": { locale: "en-US", currency: "USD" },
  usa: { locale: "en-US", currency: "USD" },
  "united kingdom": { locale: "en-GB", currency: "GBP" },
  uk: { locale: "en-GB", currency: "GBP" },
  germany: { locale: "de-DE", currency: "EUR" },
  sweden: { locale: "sv-SE", currency: "SEK" },
  denmark: { locale: "da-DK", currency: "DKK" },
};

export function resolveLocaleCurrency(
  localeInput: string,
  countryInput: string
): { locale: string; currency: string } {
  const countryKey = countryInput.trim().toLowerCase();
  const fromCountry = COUNTRY_DEFAULTS[countryKey];
  if (fromCountry) return fromCountry;

  if (localeInput.trim()) {
    const locale = localeInput.trim();
    const currency =
      locale.startsWith("nb") || locale.startsWith("no")
        ? "NOK"
        : locale.startsWith("en-GB")
          ? "GBP"
          : locale.startsWith("de")
            ? "EUR"
            : "USD";
    return { locale, currency };
  }

  return { locale: "en-US", currency: "USD" };
}
