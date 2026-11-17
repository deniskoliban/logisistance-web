import { CountryOption } from '../models';

/**
 * Localised country names come from `Intl.DisplayNames` instead of a hand-written dictionary,
 * so "PL" reads as "Poland" in English and "Польша" in Russian without touching the API.
 */
export function countryName(code: string, locale: string): string | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? null;
  } catch {
    return null; // very old runtime without DisplayNames
  }
}

/** Options for the country autocomplete: localised names, sorted for the active language. */
export function localizedCountryOptions(codes: string[], locale: string): CountryOption[] {
  return codes
    .map((code) => ({ code, name: countryName(code, locale) ?? code }))
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
    (option) =>
      option.name.toLowerCase().includes(needle) || option.code.toLowerCase() === needle,
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
