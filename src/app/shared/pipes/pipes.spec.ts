import { TestBed } from '@angular/core/testing';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { BundledTranslocoLoader } from '../../core/i18n/transloco-json.loader';
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from '../../core/i18n/languages';
import { LocalizedNumberPipe } from './localized-number.pipe';
import { PluralPipe } from './plural.pipe';

function configure(): void {
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
}

async function activate(transloco: TranslocoService, language: 'en' | 'ru'): Promise<void> {
  transloco.setActiveLang(language);
  await firstValueFrom(transloco.load(language));
}

describe('PluralPipe', () => {
  let pipe: PluralPipe;
  let transloco: TranslocoService;

  beforeEach(() => {
    configure();
    transloco = TestBed.inject(TranslocoService);
    pipe = TestBed.runInInjectionContext(() => new PluralPipe());
  });

  it('uses the Russian few-form for 3 vehicles', async () => {
    await activate(transloco, 'ru');
    expect(pipe.transform('vehicles.count', 3)).toBe('3 машины');
  });

  it('uses the Russian many-form for 5 vehicles', async () => {
    await activate(transloco, 'ru');
    expect(pipe.transform('vehicles.count', 5)).toBe('5 машин');
  });

  it('uses the English other-form for 2 vehicles', async () => {
    await activate(transloco, 'en');
    expect(pipe.transform('vehicles.count', 2)).toBe('2 vehicles');
  });
});

describe('LocalizedNumberPipe', () => {
  let pipe: LocalizedNumberPipe;
  let transloco: TranslocoService;

  beforeEach(() => {
    configure();
    transloco = TestBed.inject(TranslocoService);
    pipe = TestBed.runInInjectionContext(() => new LocalizedNumberPipe());
  });

  it('groups thousands per language', async () => {
    await activate(transloco, 'en');
    expect(pipe.transform(24500)).toBe('24,500');

    await activate(transloco, 'ru');
    expect(pipe.transform(24500).replace(/\s/g, ' ')).toBe('24 500');
  });

  it('keeps fraction digits when asked', async () => {
    await activate(transloco, 'en');
    expect(pipe.transform(88.5, 1)).toBe('88.5');
  });

  it('renders an empty string for missing values', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
