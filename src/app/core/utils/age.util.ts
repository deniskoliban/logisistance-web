/** Driver age rules shared with the API (18–100). */
export const MIN_DRIVER_AGE = 18;
export const MAX_DRIVER_AGE = 100;

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

/** Returns a validation message for a date of birth, or null when it is acceptable. */
export function validateDriverAge(isoDate: string): string | null {
  if (!isoDate) {
    return null; // emptiness is reported by the required rule
  }

  const age = yearsSince(isoDate);
  if (age === null) {
    return 'Enter a valid date';
  }
  if (age < 0) {
    return 'Date of birth cannot be in the future';
  }
  if (age < MIN_DRIVER_AGE) {
    return `Drivers must be at least ${MIN_DRIVER_AGE}`;
  }
  if (age > MAX_DRIVER_AGE) {
    return `Drivers must be at most ${MAX_DRIVER_AGE}`;
  }
  return null;
}
