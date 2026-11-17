/** Locale-aware number formatting, so 24500 reads as "24,500" or "24 500" depending on language. */
export function formatNumber(value: number, locale: string, maximumFractionDigits = 0): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  } catch {
    return String(value);
  }
}
