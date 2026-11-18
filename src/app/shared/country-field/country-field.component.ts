import { Component, computed, effect, inject, input, model } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { CountryCatalog } from '../../core/fleet/country-catalog.service';
import { filterCountries } from '../../core/utils/country.util';
import { AutoSelectExactDirective } from '../directives/auto-select-exact.directive';
import { MatchableOption } from '../directives/autocomplete-match.util';
import { FormErrorPipe } from '../pipes/form-error.pipe';

/**
 * Searchable country field bound to a signal-forms field.
 *
 * The input holds the localised country *name*; the ISO *code* is exposed through the two-way
 * `code` model so callers never map names to codes themselves. Typing a name in full is enough:
 * `autoSelectExact` turns the text into the option instead of requiring a click.
 */
@Component({
  selector: 'app-country-field',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    FormField,
    TranslocoPipe,
    FormErrorPipe,
    AutoSelectExactDirective,
  ],
  templateUrl: './country-field.component.html',
  styleUrl: './country-field.component.scss',
})
export class CountryFieldComponent {
  private readonly catalog = inject(CountryCatalog);
  private readonly transloco = inject(TranslocoService);

  /** The signal-forms field this input edits; its value is the country name. */
  readonly field = input.required<FieldTree<string>>();
  /** Dictionary key for the label, e.g. `fields.countryOfResidence`. */
  readonly labelKey = input.required<string>();
  /** Selected ISO code, two-way bound: `[(code)]="residenceCountry"`. */
  readonly code = model<string | null>(null);

  protected readonly options = this.catalog.options;

  /** Same list as plain data, for the auto-select directive. */
  protected readonly optionItems = computed<MatchableOption[]>(() =>
    this.options().map((country) => ({ value: country.name, viewValue: country.name })),
  );

  /** Current text in the input, kept as a signal so template filtering stays reactive. */
  protected readonly value = computed(() => this.field()().value());

  protected readonly filtered = computed(() => filterCountries(this.options(), this.value()));

  constructor() {
    // Text → code: a typed-out English name (or an exact ISO code) resolves to its code.
    effect(() => {
      const options = this.catalog.options();
      if (options.length === 0) {
        // Deciding on an empty list would clear a selection that is simply waiting for the fetch.
        return;
      }
      const text = this.value();
      const matched = this.catalog.codeFor(text);
      if (matched) {
        if (matched !== this.code()) {
          this.code.set(matched);
        }
        return;
      }

      if (this.code() !== null) {
        this.code.set(null);
      }
    });

    // Code → text: a code set from outside shows its name once the country list has loaded.
    effect(() => {
      const code = this.code();
      if (!code) {
        return;
      }
      // The catalog owns the naming rule (the API's English list), so the field and the rest of the
      // app can never disagree about what a country is called.
      const name = this.catalog.nameFor(code);
      if (name && name !== this.value()) {
        this.field()().value.set(name);
      }
    });
  }
}
