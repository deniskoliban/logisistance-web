import { validateDriverAge, yearsSince } from './age.util';

/** ISO date `years` before today; pass a negative number for a future date. */
function isoYearsFromToday(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

describe('yearsSince', () => {
  const today = new Date(2026, 10, 17); // 17 November 2026

  it('counts whole years only', () => {
    expect(yearsSince('1985-04-12', today)).toBe(41);
    expect(yearsSince('1985-11-17', today)).toBe(41); // birthday today
    expect(yearsSince('1985-11-18', today)).toBe(40); // birthday tomorrow
  });

  it('rejects input that is not a real calendar date', () => {
    expect(yearsSince('not-a-date', today)).toBeNull();
    expect(yearsSince('2026-02-31', today)).toBeNull();
    expect(yearsSince('2026-13-01', today)).toBeNull();
  });
});

describe('validateDriverAge', () => {
  it('accepts a working-age driver', () => {
    expect(validateDriverAge(isoYearsFromToday(35))).toBeNull();
  });

  it('accepts exactly 18', () => {
    expect(validateDriverAge(isoYearsFromToday(18))).toBeNull();
  });

  it('reports under-18 drivers', () => {
    expect(validateDriverAge(isoYearsFromToday(10))).toBe('ageTooYoung');
  });

  it('reports future dates of birth', () => {
    expect(validateDriverAge(isoYearsFromToday(-1))).toBe('ageFuture');
  });

  it('reports implausibly old drivers', () => {
    expect(validateDriverAge(isoYearsFromToday(120))).toBe('ageTooOld');
  });

  it('reports unparseable dates', () => {
    expect(validateDriverAge('1988-02-31')).toBe('dateInvalid');
  });

  it('leaves empty values to the required rule', () => {
    expect(validateDriverAge('')).toBeNull();
  });
});
