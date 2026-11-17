/** Date helpers for display and for sending dates to the API. */

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
