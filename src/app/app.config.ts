import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { authInterceptor } from './core/auth/auth.interceptor';
import { BundledTranslocoLoader } from './core/i18n/transloco-json.loader';
import { LanguageService } from './core/services/language.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['en', 'ru'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: { useFallbackTranslation: true, logMissingKey: !isDevMode() },
      },
      loader: BundledTranslocoLoader,
    }),
    // Resolve the language before the first render so nothing flashes in the default locale.
    provideAppInitializer(() => inject(LanguageService).initialize()),
  ],
};
