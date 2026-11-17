import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type LanguageCode = 'en' | 'ru';

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'ru'] as const;

const STORAGE_KEY = 'logisistance.lang';

/**
 * Keeps the active UI language in sync between Transloco, the `<html lang>` attribute and
 * localStorage, mirroring how ThemeService handles the colour theme.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  /** Reactive active language, straight from Transloco. */
  readonly active = this.transloco.activeLang;

  /** Called once at bootstrap so the first render already uses the right language. */
  initialize(): void {
    this.use(this.readStored() ?? this.browserLanguage() ?? 'en');
  }

  use(language: string): void {
    const code = this.isSupported(language) ? language : 'en';

    this.transloco.setActiveLang(code);
    this.document.documentElement.lang = code;

    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage can be unavailable (private mode); the language still applies for this session
    }
  }

  private isSupported(language: string): language is LanguageCode {
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
  }

  private readStored(): LanguageCode | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && this.isSupported(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  /** First supported language among the browser preferences, e.g. `ru-RU` → `ru`. */
  private browserLanguage(): LanguageCode | null {
    if (typeof navigator === 'undefined') {
      return null;
    }
    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const candidate of candidates) {
      const base = candidate?.split('-')[0]?.toLowerCase();
      if (base && this.isSupported(base)) {
        return base;
      }
    }
    return null;
  }
}
