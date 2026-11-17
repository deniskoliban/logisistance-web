import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';

import en from '../../i18n/en.json';
import ru from '../../i18n/ru.json';

const DICTIONARIES: Record<string, Translation> = { en, ru };

/**
 * Dictionaries are bundled rather than fetched: two locales of a few kilobytes each do not
 * justify an HTTP round trip, and it removes a flash of untranslated UI on first paint.
 * When the app grows to many locales or large per-feature scopes, swap this for an HTTP loader
 * (`/i18n/{lang}.json`) plus Transloco scopes — the rest of the code stays the same.
 */
@Injectable({ providedIn: 'root' })
export class BundledTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return of(DICTIONARIES[lang] ?? DICTIONARIES['en']);
  }
}
