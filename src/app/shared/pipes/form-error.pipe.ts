import { inject, Pipe, PipeTransform } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { TranslocoService } from '@jsverse/transloco';

import { errorOf } from '../../core/utils/form-error.util';

/**
 * First validation message for a signal-forms field, translated for the active language.
 *
 * Impure on purpose: the message must re-render when the language changes or the field state
 * changes, and it depends on signals read outside any input.
 */
@Pipe({ name: 'formError', pure: false })
export class FormErrorPipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(field: FieldTree<unknown>): string | null {
    this.transloco.activeLang(); // track the language so the pipe re-runs on switch
    return errorOf(field, (key, params) => this.transloco.translate(key, params));
  }
}
