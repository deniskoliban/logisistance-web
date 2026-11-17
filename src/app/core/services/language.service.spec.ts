import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';

import { BundledTranslocoLoader } from '../i18n/transloco-json.loader';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let transloco: TranslocoService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';

    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: ['en', 'ru'], defaultLang: 'en' },
          loader: BundledTranslocoLoader,
        }),
      ],
    });

    service = TestBed.inject(LanguageService);
    transloco = TestBed.inject(TranslocoService);
  });

  it('switches the active language, the html lang attribute and storage', () => {
    service.use('ru');

    expect(transloco.activeLang()).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(localStorage.getItem('logisistance.lang')).toBe('ru');
  });

  it('ignores unsupported languages and falls back to English', () => {
    service.use('de');

    expect(transloco.activeLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('restores a stored language on initialize', () => {
    localStorage.setItem('logisistance.lang', 'ru');

    service.initialize();

    expect(transloco.activeLang()).toBe('ru');
  });

  it('falls back to the browser preference when nothing is stored', () => {
    service.initialize();

    // jsdom reports an English locale, so the default must be English.
    expect(transloco.activeLang()).toBe('en');
  });
});
