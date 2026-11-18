import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { provideNgxMask } from 'ngx-mask';
import { firstValueFrom } from 'rxjs';

import { authInterceptor } from './core/auth/auth.interceptor';
import { LocalizedDateAdapter } from './core/dates/localized-date-adapter';
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from './core/i18n/languages';
import { BundledTranslocoLoader } from './core/i18n/transloco-json.loader';
import { LanguageService } from './core/services/language.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
    // Material's native adapter parses with Date.parse, which ignores the locale; ours reads the
    // field text in the order the locale prints it. Registered after the default, so it wins.
    { provide: DateAdapter, useClass: LocalizedDateAdapter },
    // Only the mask engine is used (see DateMaskDirective); separators stay in the rendered text.
    provideNgxMask({ dropSpecialCharacters: false }),
    provideTransloco({
      config: {
        // The language list and the fallback live in `core/i18n/languages.ts`, so adding a
        // language is one code in one array plus its dictionary file.
        availableLangs: [...SUPPORTED_LANGUAGES],
        defaultLang: FALLBACK_LANGUAGE,
        fallbackLang: FALLBACK_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { useFallbackTranslation: true, logMissingKey: !isDevMode() },
      },
      loader: BundledTranslocoLoader,
    }),
    // Resolve the language and load its dictionary before the first render, so no screen can
    // flash raw keys or the default locale.
    provideAppInitializer(() => {
      const languageService = inject(LanguageService);
      const transloco = inject(TranslocoService);
      languageService.initialize();
      return firstValueFrom(transloco.load(transloco.getActiveLang()));
    }),
  ],
};
