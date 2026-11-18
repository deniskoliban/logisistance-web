import { CountryOption } from '../models';

/**
 * Country names are **not** translated.
 *
 * A country is a proper noun and the API already publishes one canonical English list
 * (`app/core/reference.py`); a carrier reads "Germany" or "Netherlands" in any UI language, the same way
 * he reads "MAN" or "AB 1234 CD". One list serves every language the app will ever ship, with no
 * per-language name drift ("Чехия" vs "Чешская Республика") and no dependency on `Intl.DisplayNames`,
 * which silently answers in the runtime's default locale when regional data is missing
 * (`GOTCHAS.md` G11, `DECISIONS.md` D15).
 *
 * What gets stored is the ISO code, so this is a display decision only.
 */

/** Options sorted the one way every language can read: alphabetically, with English collation. */
export function sortedCountryOptions(options: readonly CountryOption[]): CountryOption[] {
  return [...options].sort((left, right) => left.name.localeCompare(right.name, 'en'));
}

/**
 * Filter for the country autocomplete: matches on the English name substring or the exact ISO code,
 * so "Ger", "germany" and "de" all find Germany.
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

/**
 * The autocomplete shows names, the API stores ISO codes. An exact ISO code is accepted as well, so a
 * field seeded with a code before the country list has loaded resolves cleanly once the list arrives.
 */
export function countryCodeFor(options: CountryOption[], text: string): string | null {
  const needle = text.trim().toLowerCase();
  if (!needle) {
    return null;
  }
  const byName = options.find((option) => option.name.toLowerCase() === needle);
  if (byName) {
    return byName.code;
  }
  return options.find((option) => option.code.toLowerCase() === needle)?.code ?? null;
}
