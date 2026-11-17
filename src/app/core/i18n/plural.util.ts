/** Plural category picking for the active locale, using CLDR rules from Intl. */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

const FALLBACK: PluralCategory = 'other';

/**
 * `pluralCategory('ru', 3)` → 'few', `pluralCategory('ru', 5)` → 'many',
 * `pluralCategory('en', 2)` → 'other'. Russian needs three forms, English two.
 */
export function pluralCategory(locale: string, count: number): PluralCategory {
  try {
    return new Intl.PluralRules(locale).select(count) as PluralCategory;
  } catch {
    return count === 1 ? 'one' : FALLBACK;
  }
}

/**
 * Builds the dictionary key for a count-based message, e.g.
 * `pluralKey('vehicles.count', 'ru', 5)` → `vehicles.count.many`.
 */
export function pluralKey(base: string, locale: string, count: number): string {
  return `${base}.${pluralCategory(locale, count)}`;
}
