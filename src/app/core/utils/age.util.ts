/** Driver age rules shared with the API (18–100). */
export const MIN_DRIVER_AGE = 18;
export const MAX_DRIVER_AGE = 100;

/** Machine-readable reasons a date of birth is rejected; translated in form-error.util.ts. */
export type DriverAgeIssue = 'dateInvalid' | 'ageFuture' | 'ageTooYoung' | 'ageTooOld';

/** Whole years between an ISO date (yyyy-mm-dd) and today, or null if unparseable. */
export function yearsSince(isoDate: string, today: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return null;
  }

  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) {
    return null; // e.g. 2026-02-31
  }

  let age = today.getFullYear() - year;
  const hadBirthday =
    today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
  if (!hadBirthday) {
    age -= 1;
  }
  return age;
}

/** Returns why a date of birth is unacceptable, or null when it passes. */
export function validateDriverAge(isoDate: string): DriverAgeIssue | null {
  if (!isoDate) {
    return null; // emptiness is reported by the required rule
  }

  const age = yearsSince(isoDate);
  if (age === null) {
    return 'dateInvalid';
  }
  if (age < 0) {
    return 'ageFuture';
  }
  if (age < MIN_DRIVER_AGE) {
    return 'ageTooYoung';
  }
  if (age > MAX_DRIVER_AGE) {
    return 'ageTooOld';
  }
  return null;
}
