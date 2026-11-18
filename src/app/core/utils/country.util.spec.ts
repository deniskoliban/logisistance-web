import { CountryOption } from '../models';
import { countryCodeFor, filterCountries, sortedCountryOptions } from './country.util';

const OPTIONS: CountryOption[] = [
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'CZ', name: 'Czechia' },
];

describe('sortedCountryOptions', () => {
  it('sorts alphabetically in one order for every language, without touching the input', () => {
    const sorted = sortedCountryOptions(OPTIONS);

    expect(sorted.map((option) => option.name)).toEqual(['Czechia', 'Germany', 'Poland']);
    expect(OPTIONS.map((option) => option.name)).toEqual(['Poland', 'Germany', 'Czechia']);
  });
});

describe('filterCountries', () => {
  it('matches on the name, case-insensitively', () => {
    expect(filterCountries(OPTIONS, 'ger').map((o) => o.code)).toEqual(['DE']);
    expect(filterCountries(OPTIONS, 'GERMANY').map((o) => o.code)).toEqual(['DE']);
  });

  it('matches the ISO code exactly, so a driver can type "cz"', () => {
    expect(filterCountries(OPTIONS, 'cz').map((o) => o.code)).toEqual(['CZ']);
  });

  it('returns everything for an empty query', () => {
    expect(filterCountries(OPTIONS, '   ')).toHaveLength(3);
  });
});

describe('countryCodeFor', () => {
  it('maps a typed name back to the ISO code the API stores', () => {
    expect(countryCodeFor(OPTIONS, ' Poland ')).toBe('PL');
  });

  it('accepts an exact ISO code, so a field seeded with a code resolves once the list arrives', () => {
    expect(countryCodeFor(OPTIONS, 'pl')).toBe('PL');
    expect(countryCodeFor(OPTIONS, ' CZ ')).toBe('CZ');
  });

  it('returns null for free text, which the country field treats as "nothing selected"', () => {
    expect(countryCodeFor(OPTIONS, 'Polska')).toBeNull();
    expect(countryCodeFor(OPTIONS, '')).toBeNull();
  });
});
