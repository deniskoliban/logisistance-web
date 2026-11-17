import { Directive, effect, inject, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { findExactOption, MatchableOption } from './autocomplete-match.util';

/**
 * Turns a fully typed option label into a real selection: when the field text equals one of the
 * options (ignoring case and surrounding spaces), the canonical option value is written back into
 * the field and the panel closes, so no click is required.
 *
 * It reacts to the bound field value instead of DOM input events: the `[formField]` binding writes
 * the model from its own input listener, so a listener here would race with it depending on
 * registration order. The option list is passed in as data, because the panel only renders
 * `mat-option`s while it is open (the rendered list is empty on the first keystroke).
 *
 * Usage with signal forms:
 *
 * ```html
 * <input matInput [formField]="form.country" [matAutocomplete]="auto"
 *        [autoSelectExact]="[{ value: 'Poland', viewValue: 'Poland' }]" />
 * ```
 */
@Directive({
  selector: 'input[matAutocomplete][autoSelectExact]',
})
export class AutoSelectExactDirective {
  private readonly trigger = inject(MatAutocompleteTrigger, { host: true });
  private readonly formField = inject(FormField<unknown>, { host: true });

  /** Options to match against; `viewValue` is what the user types, `value` is what gets selected. */
  readonly options = input.required<readonly MatchableOption[]>({ alias: 'autoSelectExact' });

  constructor() {
    effect(() => {
      const value = this.formField.state().value();
      if (typeof value !== 'string') {
        return;
      }

      const match = findExactOption(this.options(), value);
      if (!match) {
        return;
      }

      // Equality check keeps this effect from looping on its own write.
      if (match.value !== value) {
        this.formField.state().value.set(match.value);
      }
      this.trigger.closePanel();
    });
  }
}
