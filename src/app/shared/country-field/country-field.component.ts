import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { FleetService } from '../../core/fleet/fleet.service';
import { CountryOption } from '../../core/models';
import {
  countryCodeFor,
  countryName,
  filterCountries,
  localizedCountryOptions,
} from '../../core/utils/country.util';
import { FormErrorPipe } from '../pipes/form-error.pipe';

/**
 * Searchable country field bound to a signal-forms field.
 *
 * Shows the localised country name in the input but exposes the ISO code through `code`,
 * so callers never have to map names back to codes themselves.
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
  ],
  templateUrl: './country-field.component.html',
  styleUrl: './country-field.component.scss',
})
export class CountryFieldComponent {
  private readonly fleetService = inject(FleetService);
  private readonly transloco = inject(TranslocoService);

  /** The signal-forms field this input edits. */
  readonly field = input.required<FieldTree<string>>();
  /** Dictionary key for the label, e.g. `fields.country`. */
  readonly labelKey = input.required<string>();
  /** Selected ISO code, two-way bound: `[(code)]="residenceCode"`. */
  readonly code = model<string | null>(null);

  private readonly countryCodes = signal<string[]>([]);

  protected readonly options = computed(() =>
    localizedCountryOptions(this.countryCodes(), this.transloco.activeLang()),
  );

  protected readonly filtered = computed(() =>
    filterCountries(this.options(), this.field()().value()),
  );

  constructor() {
    this.fleetService.countries().subscribe({
      next: (countries: CountryOption[]) =>
        this.countryCodes.set(countries.map((country) => country.code)),
      error: () => this.countryCodes.set([]),
    });

    // Keep the visible name in step with the language and with a code set from outside.
    effect(() => {
      const language = this.transloco.activeLang();
      const code = this.code();
      if (!code) {
        return;
      }
      const name = countryName(code, language);
      if (name && name !== this.field()().value()) {
        this.field()().value.set(name);
      }
    });
  }

  protected optionSelected(name: string): void {
    this.code.set(countryCodeFor(this.options(), name));
  }

  protected typed(): void {
    this.code.set(null);
  }
}
