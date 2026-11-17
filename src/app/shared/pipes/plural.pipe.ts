import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { pluralKey } from '../../core/i18n/plural.util';

/**
 * Translates a counted message using CLDR plural rules of the active language.
 *
 * `{{ 'vehicles.count' | plural: 3 }}` picks `vehicles.count.few` in Russian and
 * `vehicles.count.other` in English, passing `count` as the interpolation parameter.
 */
@Pipe({ name: 'plural', pure: false })
export class PluralPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(baseKey: string, count: number): string {
    const language = this.transloco.activeLang();
    return this.transloco.translate(pluralKey(baseKey, language, count), { count });
  }
}
