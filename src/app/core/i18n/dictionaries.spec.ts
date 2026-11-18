import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';

import { DICTIONARIES } from '../../i18n';
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, type LanguageCode } from './languages';
import { BundledTranslocoLoader } from './transloco-json.loader';
import { UNTRANSLATED_KEYS } from './untranslated.keys';

/** CLDR plural categories; each language uses the subset its grammar has. */
const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

type Dictionary = Record<string, unknown>;

/** Every shipped dictionary, so adding a language to `SUPPORTED_LANGUAGES` also covers it here. */
const SHIPPED: [LanguageCode, Dictionary][] = SUPPORTED_LANGUAGES.map((code) => [
  code,
  (DICTIONARIES[code] ?? {}) as Dictionary,
]);

const FALLBACK: Dictionary = (DICTIONARIES[FALLBACK_LANGUAGE] ?? {}) as Dictionary;

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

/** Flattens a nested dictionary into an object keyed by dotted path. */
function flattenToObject(dictionary: Dictionary): Record<string, unknown> {
  return Object.fromEntries(flatten(dictionary));
}

describe('translation dictionaries', () => {
  it('ship one dictionary per supported language', () => {
    expect(SUPPORTED_LANGUAGES.filter((code) => !DICTIONARIES[code])).toEqual([]);
  });

  it('cover the same keys in every language, so none silently loses a string', () => {
    const expected = sharedKeys(FALLBACK);

    for (const [code, dictionary] of SHIPPED) {
      const actual = sharedKeys(dictionary);
      expect({
        language: code,
        missing: expected.filter((key) => !actual.includes(key)),
        unexpected: actual.filter((key) => !expected.includes(key)),
      }).toEqual({ language: code, missing: [], unexpected: [] });
    }
  });

  it('label every supported language in the language menu', () => {
    for (const [code, dictionary] of SHIPPED) {
      const keys = flattenToObject(dictionary);
      expect({
        language: code,
        missingLabels: SUPPORTED_LANGUAGES.filter((lang) => !(`language.${lang}` in keys)),
      }).toEqual({ language: code, missingLabels: [] });
    }
  });

  it('give every plural group an "other" form as the last-resort fallback', () => {
    for (const [code, dictionary] of SHIPPED) {
      const keys = flattenToObject(dictionary);
      const groups = flatten(dictionary)
        .map(([key]) => key)
        .filter(isPluralLeaf)
        .map((key) => key.split('.').slice(0, -1).join('.'));

      expect({ language: code, hasPlurals: groups.length > 0 }).toEqual({
        language: code,
        hasPlurals: true,
      });
      for (const group of groups) {
        expect({ language: code, group, hasOther: `${group}.other` in keys }).toEqual({
          language: code,
          group,
          hasOther: true,
        });
      }
    }
  });

  it('hold no empty or whitespace-only strings', () => {
    const empties = SHIPPED.flatMap(([code, dictionary]) =>
      flatten(dictionary)
        .filter(([, leaf]) => typeof leaf === 'string' && leaf.trim() === '')
        .map(([key]) => `${code}:${key}`),
    );

    expect(empties).toEqual([]);
  });

  it('keep every untranslated key identical across languages', () => {
    // Samples of stored data (a name, a city, a plate, a number) have one format everywhere, so a
    // translated value means someone misunderstood the key (`untranslated.keys.ts`, DECISIONS D11).
    const reference = flattenToObject(FALLBACK);
    const missing = UNTRANSLATED_KEYS.filter((key) => !(key in reference));
    expect(missing).toEqual([]);

    for (const [code, dictionary] of SHIPPED) {
      const values = flattenToObject(dictionary);
      const diverged = UNTRANSLATED_KEYS.filter((key) => values[key] !== reference[key]);
      expect({ language: code, diverged }).toEqual({ language: code, diverged: [] });
    }
  });

  it('list only placeholders as untranslated, so the list cannot quietly grow into UI text', () => {
    expect(UNTRANSLATED_KEYS.filter((key) => !key.startsWith('placeholders.'))).toEqual([]);
  });
});

describe('BundledTranslocoLoader', () => {
  function loader(): BundledTranslocoLoader {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: {
            availableLangs: [...SUPPORTED_LANGUAGES],
            defaultLang: FALLBACK_LANGUAGE,
          },
          loader: BundledTranslocoLoader,
        }),
      ],
    });

    const instance = TestBed.inject(BundledTranslocoLoader);
    // Touching Transloco boots its config, exactly as the app initializer does.
    TestBed.inject(TranslocoService);
    return instance;
  }

  function dictionaryFor(instance: BundledTranslocoLoader, lang: string): Dictionary {
    let result: Dictionary = {};
    instance.getTranslation(lang).subscribe((dictionary) => (result = dictionary as Dictionary));
    return result;
  }

  it('returns the dictionary of every supported language', () => {
    const instance = loader();

    for (const code of SUPPORTED_LANGUAGES) {
      expect({ language: code, keys: sharedKeys(dictionaryFor(instance, code)) }).toEqual({
        language: code,
        keys: sharedKeys((DICTIONARIES[code] ?? {}) as Dictionary),
      });
    }
  });

  it('falls back to the fallback language for one we do not ship', () => {
    const instance = loader();
    const unknown = dictionaryFor(instance, 'de') as { nav: { fleet: string } };

    expect(unknown.nav.fleet).toBe((FALLBACK as { nav: { fleet: string } }).nav.fleet);
  });
});
