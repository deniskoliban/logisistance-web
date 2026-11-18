import { CountryOption } from '../models';

/** Transloco-style translate function: returns the key itself when the dictionary has no entry. */
export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

/**
 * Localised country name.
 *
 * The dictionaries are authoritative (`countries.<ISO>`) so a country reads like every other string
 * in the UI; `Intl.DisplayNames` is only a fallback for a code the dictionaries do not carry (a new
 * country added on the API before the dictionaries catch up).
 *
 * `Intl` alone is not enough: a runtime without regional data silently answers with the default
 * locale — an English name in a Russian UI, with no error — which is exactly the trap in
 * `GOTCHAS.md` G11. That is why the names live in the dictionaries and a spec keeps them complete.
 */
export function countryLabel(code: string, t: TranslateFn, locale: string): string {
  const key = `countries.${code}`;
  const translated = t(key);
  if (translated && translated !== key) {
    return translated;
  }
  return countryName(code, locale) ?? code;
}

/** `Intl.DisplayNames` lookup; the fallback path of `countryLabel`. */
export function countryName(code: string, locale: string): string | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? null;
  } catch {
    return null; // very old runtime without DisplayNames
  }
}

/** Options for the country autocomplete: localised names, sorted for the active language. */
export function localizedCountryOptions(
  codes: string[],
  t: TranslateFn,
  locale: string,
): CountryOption[] {
  return codes
    .map((code) => ({ code, name: countryLabel(code, t, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * Filter for the country autocomplete: matches on name substring or exact code,
 * so both "Pol" and "pl" find Poland (and "Пол" finds Польша).
 */
export function filterCountries(options: CountryOption[], query: string): CountryOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return options;
  }
  return options.filter(
    (option) => option.name.toLowerCase().includes(needle) || option.code.toLowerCase() === needle,
  );
}

/** The autocomplete shows names, the API stores ISO codes. */
export function countryCodeFor(options: CountryOption[], name: string): string | null {
  const needle = name.trim().toLowerCase();
  return options.find((option) => option.name.toLowerCase() === needle)?.code ?? null;
}

/**
 * Whether `text` is the name of `code` in any of `locales`.
 *
 * Needed when the UI language changes: the input still holds the previous language's label for a
 * moment, and that must not be mistaken for free text (which would clear the selected country).
 */
export function countryNameMatchesAnyLocale(
  code: string,
  text: string,
  locales: readonly string[],
): boolean {
  const needle = text.trim().toLowerCase();
  return locales.some((locale) => (countryName(code, locale) ?? '').toLowerCase() === needle);
}
