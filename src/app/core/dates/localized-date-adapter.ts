import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

type DatePart = 'day' | 'month' | 'year';

/**
 * Native adapter with a locale-aware `parse`.
 *
 * Material's own implementation is `new Date(Date.parse(value))`, which ignores the locale: typed
 * `12.05.1990` is read as US `mm.dd.yyyy` and silently becomes 5 December, while `format()` renders
 * it back in the locale order. That mismatch made manual entry in Russian wrong (or, for `15.01.1996`,
 * simply invalid). Here the field text is parsed in the order the locale prints it.
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

    // A leading 4-digit number is an ISO-ish `yyyy-mm-dd`, everything else follows the locale order.
    const order: readonly DatePart[] =
      numbers[0] > 31 ? ['year', 'month', 'day'] : this.partOrder();
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

  /** Order in which this locale prints day, month and year, e.g. `['day','month','year']` for ru. */
  private partOrder(): [DatePart, DatePart, DatePart] {
    const parts = new Intl.DateTimeFormat(this.locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .formatToParts(new Date(2001, 10, 22))
      .map((part) => part.type)
      .filter((type): type is DatePart => type === 'day' || type === 'month' || type === 'year');

    return parts.length === 3 ? (parts as [DatePart, DatePart, DatePart]) : ['day', 'month', 'year'];
  }
}
