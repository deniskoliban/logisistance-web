import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';

import en from '../../i18n/en.json';
import ru from '../../i18n/ru.json';
import { BundledTranslocoLoader } from './transloco-json.loader';

/** CLDR plural categories; Russian legitimately has more of them than English. */
const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

type Dictionary = Record<string, unknown>;

function flatten(value: unknown, prefix = ''): [key: string, leaf: unknown][] {
  if (typeof value !== 'object' || value === null) {
    return [[prefix, value]];
  }
  return Object.entries(value as Dictionary).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

const isPluralLeaf = (key: string) => PLURAL_CATEGORIES.has(key.split('.').pop() ?? '');

/** Keys that must exist in every language: everything except the plural category variants. */
function sharedKeys(dictionary: Dictionary): string[] {
  return flatten(dictionary)
    .map(([key]) => key)
    .filter((key) => !isPluralLeaf(key))
    .sort();
}

describe('translation dictionaries', () => {
  it('cover the same keys, so no language silently loses a string', () => {
    expect(sharedKeys(ru)).toEqual(sharedKeys(en));
  });

  it('give every plural group an "other" form as the last-resort fallback', () => {
    for (const dictionary of [en, ru]) {
      const groups = flatten(dictionary)
        .map(([key]) => key)
        .filter(isPluralLeaf)
        .map((key) => key.split('.').slice(0, -1).join('.'));

      expect(groups.length).toBeGreaterThan(0);
      for (const group of groups) {
        expect(`${group}.other` in flattenToObject(dictionary) ? group : null).toBe(group);
      }
    }
  });

  it('hold no empty or whitespace-only strings', () => {
    const empties = [en, ru].flatMap((dictionary) =>
      flatten(dictionary)
        .filter(([, leaf]) => typeof leaf === 'string' && leaf.trim() === '')
        .map(([key]) => key),
    );

    expect(empties).toEqual([]);
  });
});

/** Flattens a nested dictionary into an object keyed by dotted path. */
function flattenToObject(dictionary: Dictionary): Record<string, unknown> {
  return Object.fromEntries(flatten(dictionary));
}

describe('BundledTranslocoLoader', () => {
  it('returns the dictionary for a language and falls back to English', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: ['en', 'ru'], defaultLang: 'en' },
          loader: BundledTranslocoLoader,
        }),
      ],
    });

    const loader = TestBed.inject(BundledTranslocoLoader);
    const seen: Record<string, unknown> = {};
    loader.getTranslation('ru').subscribe((dictionary) => (seen['ru'] = dictionary));
    loader.getTranslation('de').subscribe((dictionary) => (seen['de'] = dictionary));

    expect((seen['ru'] as { nav: { fleet: string } }).nav.fleet).toBe('Автопарк');
    expect((seen['de'] as { nav: { fleet: string } }).nav.fleet).toBe('Fleet');
  });
});
