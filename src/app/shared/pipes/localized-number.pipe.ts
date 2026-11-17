import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { formatNumber } from '../../core/utils/number.util';

/** Formats a number for the active language: 24500 → "24,500" (en) / "24 500" (ru). */
@Pipe({ name: 'localizedNumber', pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(value: number | null | undefined, fractionDigits = 0): string {
    if (value === null || value === undefined) {
      return '';
    }
    return formatNumber(value, this.transloco.activeLang(), fractionDigits);
  }
}
