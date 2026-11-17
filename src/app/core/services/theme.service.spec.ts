import { Injectable } from '@angular/core';

import { ColorTheme, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    service = new ThemeService();
  });

  it('applies the initial theme as a class on the root element', () => {
    const expected = service.theme() === 'dark' ? 'dark-theme' : 'light-theme';
    expect(document.documentElement.classList.contains(expected)).toBe(true);
  });

  it('toggles between light and dark and tracks isDark', () => {
    const initial: ColorTheme = service.theme();

    expect(service.toggle()).toBe(initial === 'dark' ? 'light' : 'dark');
    expect(service.isDark()).toBe(initial !== 'dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(initial !== 'dark');
  });

  it('persists the chosen theme', () => {
    const next = service.toggle();
    expect(localStorage.getItem('logisistance.theme')).toBe(next);
  });

  it('restores the stored theme on a fresh instance', () => {
    service.set('dark');
    const fresh = new ThemeService();
    expect(fresh.theme()).toBe('dark');
    expect(fresh.isDark()).toBe(true);
  });
});
