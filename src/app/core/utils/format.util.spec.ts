import { dateInputMask, formatDate, fromIsoDate, toIsoDate } from './date.util';
import { formatNumber } from './number.util';

describe('toIsoDate / fromIsoDate', () => {
  it('round-trips a local calendar date without timezone drift', () => {
    const date = new Date(1988, 2, 10);
    expect(toIsoDate(date)).toBe('1988-03-10');
    expect(fromIsoDate('1988-03-10')).toEqual(date);
  });

  it('rejects impossible dates', () => {
    expect(fromIsoDate('2026-02-31')).toBeNull();
    expect(fromIsoDate('not-a-date')).toBeNull();
  });
});

describe('formatDate', () => {
  it('formats an ISO date for the locale', () => {
    expect(formatDate('1988-03-10', 'en-GB')).toContain('10');
    expect(formatDate('1988-03-10', 'ru')).toContain('1988');
  });

  it('returns the input unchanged when it is not an ISO date', () => {
    expect(formatDate('not-a-date', 'en')).toBe('not-a-date');
    expect(formatDate('2026-02-31', 'en')).toBe('2026-02-31');
  });
});

describe('dateInputMask', () => {
  it('follows the date adapter format of each language', () => {
    expect(dateInputMask('ru')).toBe('00.00.0000');
    expect(dateInputMask('ru-RU')).toBe('00.00.0000');
    expect(dateInputMask('en')).toBe('00/00/0000');
    expect(dateInputMask('en-US')).toBe('00/00/0000');
  });
});

describe('formatNumber', () => {
  it('groups thousands for the locale', () => {
    expect(formatNumber(24500, 'en', 0)).toBe('24,500');
    // Russian uses a non-breaking space as the group separator; normalise it for the assertion.
    expect(formatNumber(24500, 'ru', 0).replace(/\s/g, ' ')).toBe('24 500');
  });

  it('keeps the requested fraction digits', () => {
    expect(formatNumber(88.5, 'ru', 1).replace(',', '.')).toBe('88.5');
    expect(formatNumber(13.6, 'en', 1)).toBe('13.6');
  });

  it('never throws for an unknown locale tag', () => {
    // Intl falls back to the runtime default locale instead of failing, so only stability is asserted.
    expect(formatNumber(1500, 'zz', 0).length).toBeGreaterThan(0);
  });
});
