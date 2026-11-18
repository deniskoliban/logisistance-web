/**
 * The languages the UI ships with — the single place to add one.
 *
 * To add a language: add its code below, add `src/app/i18n/<code>.json`, and list the import in
 * `src/app/i18n/index.ts`. Nothing else keys off a specific language:
 *
 * - the toolbar menu iterates this list and reads its label from `language.<code>`;
 * - Transloco gets `availableLangs` from here (plus `FALLBACK_LANGUAGE` for missing keys);
 * - plurals, numbers, dates and country names come from `Intl` for any tag, no per-language code;
 * - `dictionaries.spec.ts` checks every language in this list for key parity, plural forms and
 *   untranslated values, so a half-added language fails the suite instead of shipping.
 *
 * Right-to-left scripts are out of scope for now: nothing sets `dir="rtl"` yet, so adding Arabic
 * or Hebrew means handling writing direction before adding the code here.
 */
export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

/** Used when the browser asks for a language we do not ship, and as the base for missing keys. */
export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export function isSupportedLanguage(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}
