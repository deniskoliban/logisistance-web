import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { authInterceptor } from './core/auth/auth.interceptor';
import { BundledTranslocoLoader } from './core/i18n/transloco-json.loader';
import { LanguageService } from './core/services/language.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNativeDateAdapter(),
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
