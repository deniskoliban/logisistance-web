import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

type DatePart = 'day' | 'month' | 'year';

/**
 * Date adapter with one universal European order: `dd.mm.yyyy`, in every language.
 *
 * Two Material behaviours had to be replaced:
 *
 * - `parse` is `new Date(Date.parse(value))` in the native adapter, which reads typed `12.05.1990`
 *   as US `mm.dd.yyyy` (5 December) and rejects `15.01.1996` outright.
 * - `format` follows the locale, so the field text changed order with the UI language while the mask
 *   and the parser kept one order — a date picked from the calendar came back as `1/20/1996`.
 *
 * The order is fixed for now so that a saved date reads the same everywhere (`DECISIONS.md` D12);
 * the locale still decides month and weekday names, so the calendar header stays localised. Switching
 * to per-locale reading later means changing `partOrder()` and `format()` here, plus `dateInputMask`.
 */
@Injectable()
export class LocalizedDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value as never);
    }

    const text = value.trim();
    if (!text) {
      return null;
    }

    const numbers = text
      .split(/\D+/)
      .filter(Boolean)
      .map((part) => Number(part));

    // Two numbers are not a date: never hand half-typed text to Date.parse, which would read
    // "12.05" as 5 December of the current year.
    if (numbers.length !== 3 || numbers.some((part) => !Number.isFinite(part))) {
      return null;
    }

    // A leading 4-digit number is an ISO `yyyy-mm-dd`, everything else is day first.
    const order: readonly DatePart[] =
      numbers[0] > 31 ? ['year', 'month', 'day'] : ['day', 'month', 'year'];
    const [first, second, third] = numbers;
    const values: Record<DatePart, number> = { day: 0, month: 0, year: 0 };

    values[order[0]] = first;
    values[order[1]] = second;
    values[order[2]] = third;

    const { day, month, year } = values;
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    const isReal =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    return isReal ? date : null;
  }

  /**
   * The datepicker asks for a purely numeric format for the field's own text; that one is ours.
   * Everything else (month and weekday names in the calendar, the toggle's label) keeps Material's
   * localised wording.
   */
  override format(date: Date, displayFormat: Intl.DateTimeFormatOptions): string {
    const isNumericFieldFormat =
      displayFormat.year === 'numeric' &&
      displayFormat.month === 'numeric' &&
      displayFormat.day === 'numeric';

    if (!isNumericFieldFormat) {
      return super.format(date, displayFormat);
    }

    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(this.getDate(date))}.${pad(this.getMonth(date) + 1)}.${this.getYear(date)}`;
  }
}
