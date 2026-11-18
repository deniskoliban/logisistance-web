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
  it('reads day.month.year for Russian', () => {
    const adapter = adapterFor('ru');
    const date = adapter.parse('12.05.1990');

    expect(date?.getFullYear()).toBe(1990);
    expect(date?.getMonth()).toBe(4); // May
    expect(date?.getDate()).toBe(12);
  });

  it('reads month/day/year for English', () => {
    const adapter = adapterFor('en');
    const date = adapter.parse('05/12/1990');

    expect(date?.getMonth()).toBe(4); // May
    expect(date?.getDate()).toBe(12);
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

  it('still accepts an ISO date regardless of the locale order', () => {
    const adapter = adapterFor('ru');
    const date = adapter.parse('1990-05-12');

    expect(date?.getFullYear()).toBe(1990);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(12);
  });

  it('formats back in the locale order', () => {
    const adapter = adapterFor('ru');
    const date = adapter.parse('12.05.1990');
    expect(date && adapter.format(date, { year: 'numeric', month: 'numeric', day: 'numeric' })).toBe(
      '12.05.1990',
    );
  });
});
