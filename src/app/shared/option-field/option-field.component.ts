import { Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe } from '@jsverse/transloco';

import { AutoSelectExactDirective } from '../directives/auto-select-exact.directive';
import {
  filterOptionGroups,
  MatchableOption,
  OptionGroup,
} from '../directives/autocomplete-match.util';
import { FormErrorPipe } from '../pipes/form-error.pipe';

/**
 * Searchable option field bound to a signal-forms field.
 *
 * Built for lists that are too long to scroll — the 202 vehicle makes, the models of one make — and
 * used instead of `mat-select`, which has no search box: typing narrows the list, clicking the field
 * opens it, and typing a label out in full selects it without a click (`autoSelectExact`).
 *
 * The field holds the option's *text* (`MAN`, `TGX`), which is what the driver recognises; the parent
 * maps that text to a catalogue code when it submits, the way the country field maps a name to an ISO
 * code.
 */
@Component({
  selector: 'app-option-field',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    TranslocoPipe,
    FormErrorPipe,
    FormField,
    AutoSelectExactDirective,
  ],
  templateUrl: './option-field.component.html',
})
export class OptionFieldComponent {
  /** The signal-forms field this input edits; its value is the option text. */
  readonly field = input.required<FieldTree<string>>();
  /** Dictionary key for the label, e.g. `fields.make`. */
  readonly labelKey = input.required<string>();
  /** Dictionary key for the placeholder, e.g. `placeholders.make`. */
  readonly placeholderKey = input<string | null>(null);
  /** Options, optionally in labelled blocks (used for "common" vs "all" makes). */
  readonly optionGroups = input.required<readonly OptionGroup[]>();

  /** Everything, for the exact-match directive — it must see options the filter has hidden. */
  protected readonly allOptions = computed<MatchableOption[]>(() =>
    this.optionGroups().flatMap((group) => [...group.options]),
  );

  /** What is filtered against: the field's own text, kept as a signal so the list stays reactive. */
  protected readonly typed = computed(() => {
    const value = this.field()().value();
    return typeof value === 'string' ? value : '';
  });

  protected readonly groups = computed(() => filterOptionGroups(this.optionGroups(), this.typed()));

  protected readonly groupCount = computed(() => this.groups().length);
}
