import { Injectable, computed, signal } from '@angular/core';

export type ColorTheme = 'light' | 'dark';

const STORAGE_KEY = 'logisistance.theme';

/**
 * Light/dark theming.
 *
 * Angular Material emits its design tokens with CSS `light-dark()`, so the active palette
 * follows the CSS `color-scheme` property. The theme is switched by putting `light-theme` or
 * `dark-theme` on `<html>` (see styles.scss), and the choice is remembered across reloads.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<ColorTheme>(this.readInitialTheme());
  private readonly _isDark = computed(() => this._theme() === 'dark');

  readonly theme = this._theme.asReadonly();
  readonly isDark = this._isDark;

  constructor() {
    this.apply(this._theme());
  }

  toggle(): ColorTheme {
    const next: ColorTheme = this._isDark() ? 'light' : 'dark';
    this.set(next);
    return next;
  }

  set(theme: ColorTheme): void {
    this._theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage can be unavailable (private mode); the theme still applies for this session
    }
  }

  private apply(theme: ColorTheme): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('dark-theme', theme === 'dark');
    root.classList.toggle('light-theme', theme === 'light');
  }

  private readInitialTheme(): ColorTheme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // ignore unreadable storage and fall back to the OS preference
    }

    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'dark' : 'light';
  }
}
