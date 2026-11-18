import { countryLabel } from './country.util';
import type { TranslateFn } from './country.util';

/** A dictionary with only the keys a test needs; a missing key comes back as the key itself. */
function dictionary(entries: Record<string, string>): TranslateFn {
  return (key) => entries[key] ?? key;
}

describe('countryLabel', () => {
  it('reads the name from the dictionary, not from Intl', () => {
    const t = dictionary({ 'countries.PL': 'Польша' });

    expect(countryLabel('PL', t, 'ru')).toBe('Польша');
    // The dictionary wins even when the UI language and the Intl locale would disagree.
    expect(countryLabel('PL', t, 'en')).toBe('Польша');
  });

  it('falls back to Intl for a country the dictionaries do not carry yet', () => {
    const t = dictionary({});

    expect(countryLabel('US', t, 'en')).toBe('United States');
    expect(countryLabel('US', t, 'ru')).toBe('Соединенные Штаты');
  });

  it('never shows a raw translation key', () => {
    const t = dictionary({});

    expect(countryLabel('PL', t, 'ru')).not.toContain('countries.');
  });
});
