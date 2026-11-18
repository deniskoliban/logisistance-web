/**
 * One data format for everything the driver types.
 *
 * Names, cities, vehicle labels and plates travel to other systems (documents, freight exchanges),
 * so they are kept in Latin script only — as in a passport — no matter which UI language the person
 * used while typing. This module holds the single rule and the single error kind for it, so every
 * form reports the same message (`errors.notLatin`).
 */

/**
 * Allowed inside user data: Latin letters with their diacritics (`Gdańsk`, `François`), digits, and
 * the few separators real names and plates use (`O'Brien`, `van der Berg`, `MAN TGX 18.440`,
 * `AB 1234 CD`). Anything outside that — another script, a control character, an emoji — is out.
 */
const LATIN_DATA = /^[\p{Script=Latin}\p{M}\d .,'’&/()#+-]*$/u;

/** Whether `text` stays inside the Latin-only data format. Empty text is fine (required covers it). */
export function isLatinText(text: string): boolean {
  return LATIN_DATA.test(text);
}

/**
 * Validation result for a signal-forms `validate()` call.
 *
 * A *kind*, never a message (`CONVENTIONS.md` § Signal Forms), so the wording follows the active
 * language through the `formError` pipe.
 */
export function latinText(value: string): { kind: 'notLatin' } | null {
  return isLatinText(value) ? null : { kind: 'notLatin' };
}
