import { TestBed } from '@angular/core/testing';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';

import { LocalizedDateAdapter } from './localized-date-adapter';

function adapterFor(locale: string): LocalizedDateAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideNativeDateAdapter(),
      { provide: DateAdapter, useClass: LocalizedDateAdapter },
    ],
  });
  const adapter = TestBed.inject(DateAdapter) as LocalizedDateAdapter;
  adapter.setLocale(locale);
  return adapter;
}

describe('LocalizedDateAdapter.parse', () => {
  it('reads day.month.year in every language, so the order never depends on the UI', () => {
    for (const locale of ['ru', 'en', 'en-US']) {
      const adapter = adapterFor(locale);
      const date = adapter.parse('12.05.1990');

      expect(date?.getFullYear()).toBe(1990);
      expect(date?.getMonth()).toBe(4); // May
      expect(date?.getDate()).toBe(12);
    }
  });

  it('reads a day above 12 as a day, never as a month (the reason the order is fixed)', () => {
    const adapter = adapterFor('en-US');
    const date = adapter.parse('15.01.1996');

    expect(date?.getMonth()).toBe(0); // January
    expect(date?.getDate()).toBe(15);
  });

  it('rejects impossible calendar dates instead of rolling them over', () => {
    const adapter = adapterFor('ru');
    expect(adapter.parse('31.02.1990')).toBeNull();
    expect(adapter.parse('32.05.1990')).toBeNull();
    expect(adapter.parse('12.13.1990')).toBeNull();
  });

  it('returns null for empty or incomplete input', () => {
    const adapter = adapterFor('ru');
    expect(adapter.parse('')).toBeNull();
    expect(adapter.parse('12.05')).toBeNull();
    expect(adapter.parse('12')).toBeNull();
  });

  it('still accepts an ISO date regardless of the order', () => {
    const adapter = adapterFor('ru');
    const date = adapter.parse('1990-05-12');

    expect(date?.getFullYear()).toBe(1990);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(12);
  });

  it('formats the field text as dd.mm.yyyy in every language', () => {
    for (const locale of ['ru', 'en', 'en-US']) {
      const adapter = adapterFor(locale);
      const date = adapter.parse('12.05.1990');
      expect(
        date && adapter.format(date, { year: 'numeric', month: 'numeric', day: 'numeric' }),
      ).toBe('12.05.1990');
    }
  });

  it('leaves month names localised for the calendar header', () => {
    const adapter = adapterFor('ru');
    const date = new Date(1990, 4, 12);
    const header = adapter.format(date, { year: 'numeric', month: 'long' });

    expect(header).toContain('1990');
    expect(header.toLowerCase()).toContain('май');
  });
});
