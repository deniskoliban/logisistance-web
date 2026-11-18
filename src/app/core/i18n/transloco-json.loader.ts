import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';

import { DICTIONARIES } from '../../i18n';
import { FALLBACK_LANGUAGE } from './languages';

/**
 * Dictionaries are bundled rather than fetched: a few kilobytes per locale do not justify an HTTP
 * round trip, and it removes a flash of untranslated UI on first paint.
 * When the app grows to many locales or large per-feature scopes, swap this for an HTTP loader
 * (`/i18n/{lang}.json`) plus Transloco scopes — everything else (the language list, the menu, the
 * pipes) stays the same.
 */
@Injectable({ providedIn: 'root' })
export class BundledTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return of(DICTIONARIES[lang] ?? DICTIONARIES[FALLBACK_LANGUAGE]);
  }
}
