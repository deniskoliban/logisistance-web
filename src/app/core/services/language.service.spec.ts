import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';

import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n/languages';
import { BundledTranslocoLoader } from '../i18n/transloco-json.loader';
import { LanguageService } from './language.service';

/** A tag no release will ever ship: an unsupported-language test must not name a real candidate. */
const NOT_A_LANGUAGE = 'zz';

describe('LanguageService', () => {
  let service: LanguageService;
  let transloco: TranslocoService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';

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

    service = TestBed.inject(LanguageService);
    transloco = TestBed.inject(TranslocoService);
  });

  it('switches the active language, the html lang attribute and storage', () => {
    const [, other] = SUPPORTED_LANGUAGES;
    service.use(other);

    expect(transloco.activeLang()).toBe(other);
    expect(document.documentElement.lang).toBe(other);
    expect(localStorage.getItem('logisistance.lang')).toBe(other);
  });

  it('ignores unsupported languages and falls back to the fallback language', () => {
    service.use(NOT_A_LANGUAGE);

    expect(transloco.activeLang()).toBe(FALLBACK_LANGUAGE);
    expect(document.documentElement.lang).toBe(FALLBACK_LANGUAGE);
  });

  it('restores a stored language on initialize', () => {
    const [, other] = SUPPORTED_LANGUAGES;
    localStorage.setItem('logisistance.lang', other);

    service.initialize();

    expect(transloco.activeLang()).toBe(other);
  });

  it('falls back to the browser preference when nothing is stored', () => {
    service.initialize();

    // jsdom reports an English locale, so the result must be the fallback language.
    expect(transloco.activeLang()).toBe(FALLBACK_LANGUAGE);
  });
});
