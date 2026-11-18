/** Date helpers for display, for the API, and for the manual-input mask. */

/** Local calendar date → ISO `yyyy-mm-dd` (no timezone shifting). */
export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** ISO `yyyy-mm-dd` → local Date at midnight, or null when the string is not a real date. */
export function fromIsoDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return null;
  }
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isReal ? date : null;
}

/**
 * Mask for manual date entry, matching what the Material date adapter parses.
 *
 * One universal European order (`dd.mm.yyyy`) for every language, so a date looks the same wherever
 * it is read and typed — the locale still drives month and weekday names. Reading dates per locale
 * is a deliberate later decision (`DECISIONS.md` D12). Separators are inserted while typing.
 */
export function dateInputMask(): string {
  return '00.00.0000';
}

/** Date formatting for display, following the active UI language. */
export function formatDate(isoDate: string, locale: string): string {
  const date = fromIsoDate(isoDate);
  if (!date) {
    return isoDate;
  }

  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
  } catch {
    return isoDate;
  }
}
