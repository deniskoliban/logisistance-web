import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import {
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type LanguageCode,
} from '../i18n/languages';

const STORAGE_KEY = 'logisistance.lang';

/**
 * Keeps the active UI language in sync between Transloco, the `<html lang>` attribute and
 * localStorage, mirroring how ThemeService handles the colour theme.
 *
 * The list of languages lives in `core/i18n/languages.ts`; this service only decides which one is
 * active and falls back to `FALLBACK_LANGUAGE` for anything it does not ship.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  /** Reactive active language, straight from Transloco. */
  readonly active = this.transloco.activeLang;

  /** Called once at bootstrap so the first render already uses the right language. */
  initialize(): void {
    this.use(this.readStored() ?? this.browserLanguage() ?? FALLBACK_LANGUAGE);
  }

  use(language: string): void {
    const code = isSupportedLanguage(language) ? language : FALLBACK_LANGUAGE;

    this.transloco.setActiveLang(code);
    this.document.documentElement.lang = code;

    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage can be unavailable (private mode); the language still applies for this session
    }
  }

  private readStored(): LanguageCode | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && isSupportedLanguage(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  /** First supported language among the browser preferences, e.g. `ru-RU` -> `ru`. */
  private browserLanguage(): LanguageCode | null {
    if (typeof navigator === 'undefined') {
      return null;
    }
    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const candidate of candidates) {
      const base = candidate?.split('-')[0]?.toLowerCase();
      if (base && isSupportedLanguage(base)) {
        return base;
      }
    }
    return null;
  }
}

/** Re-exported so callers that already import the service keep one import for the language list. */
export { SUPPORTED_LANGUAGES };
