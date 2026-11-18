import { Translation } from '@jsverse/transloco';

import en from './en.json';
import ru from './ru.json';

/**
 * Every bundled dictionary, keyed by language code.
 *
 * This file and `core/i18n/languages.ts` are the two places a new language touches: drop
 * `<code>.json` next to these two, add its import below, and add the code to `SUPPORTED_LANGUAGES`.
 * The spec checks the new file for key parity, plural forms and untranslated values, and the
 * language menu picks it up on its own.
 */
export const DICTIONARIES: Record<string, Translation> = { en, ru };
