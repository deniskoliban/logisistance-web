import { CountryOption } from '../models';

/**
 * Filter for the country autocomplete: matches on name substring or exact code,
 * so both "Pol" and "pl" find Poland.
 */
export function filterCountries(countries: CountryOption[], query: string): CountryOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return countries;
  }
  return countries.filter(
    (country) =>
      country.name.toLowerCase().includes(needle) || country.code.toLowerCase() === needle,
  );
}

/** The autocomplete shows names, the API stores ISO codes. */
export function countryCodeFor(countries: CountryOption[], name: string): string | null {
  const match = countries.find((country) => country.name.toLowerCase() === name.trim().toLowerCase());
  return match?.code ?? null;
}
