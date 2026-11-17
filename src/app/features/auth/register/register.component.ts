import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { FleetService } from '../../../core/fleet/fleet.service';
import { validateDriverAge } from '../../../core/utils/age.util';
import { apiErrorMessage } from '../../../core/utils/api-error.util';
import {
  countryCodeFor,
  countryName,
  filterCountries,
  localizedCountryOptions,
} from '../../../core/utils/country.util';
import { errorOf } from '../../../core/utils/form-error.util';

interface RegisterModel {
  full_name: string;
  date_of_birth: string;
  email: string;
  password: string;
  /** Country *name* in the active language; the ISO code is tracked separately. */
  country: string;
  city: string;
}

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    FormRoot,
    FormField,
    TranslocoDirective,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly fleetService = inject(FleetService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  protected readonly countryCodes = signal<string[]>([]);
  protected readonly countryOptions = computed(() =>
    localizedCountryOptions(this.countryCodes(), this.transloco.activeLang()),
  );
  protected readonly selectedCountryCode = signal<string | null>(null);

  protected readonly model = signal<RegisterModel>({
    full_name: '',
    date_of_birth: '',
    email: '',
    password: '',
    country: '',
    city: '',
  });

  protected readonly filteredCountries = computed(() =>
    filterCountries(this.countryOptions(), this.model().country),
  );

  /** Translatable error key (follows the active language). */
  protected readonly errorKey = signal<string | null>(null);
  /** Raw message from the API, kept verbatim in English. */
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly registerForm = form(
    this.model,
    (path) => {
      required(path.full_name);
      minLength(path.full_name, 2);
      maxLength(path.full_name, 120);

      required(path.date_of_birth);
      validate(path.date_of_birth, ({ value }) => {
        const issue = validateDriverAge(value());
        return issue ? { kind: issue } : null;
      });

      required(path.email);
      email(path.email);

      required(path.password);
      minLength(path.password, 8);
      maxLength(path.password, 128);

      required(path.country);
      validate(path.country, () =>
        this.selectedCountryCode() ? null : { kind: 'countryUnknown' },
      );

      required(path.city);
      minLength(path.city, 2);
      maxLength(path.city, 120);
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          this.errorKey.set(null);
          this.serverMessage.set(null);
          const value = this.model();
          const countryCode = this.selectedCountryCode();
          if (!countryCode) {
            this.errorKey.set('errors.countryUnknown');
            return undefined;
          }

          try {
            await firstValueFrom(
              this.authService.register({ ...value, country: countryCode }),
            );
            await this.router.navigate(['/vehicles']);
          } catch (error: unknown) {
            this.serverMessage.set(
              apiErrorMessage(error, this.transloco.translate('errors.registerFailed')),
            );
          }
          return undefined;
        },
      },
    },
  );

  constructor() {
    this.fleetService.countries().subscribe({
      next: (countries) => this.countryCodes.set(countries.map((country) => country.code)),
      error: () => this.errorKey.set('errors.countriesFailed'),
    });

    // Keep the visible country name in step with the language (the chosen code never changes).
    effect(() => {
      const locale = this.transloco.activeLang();
      const code = this.selectedCountryCode();
      if (!code) {
        return;
      }
      const name = countryName(code, locale);
      if (name) {
        this.model.update((model) => (model.country === name ? model : { ...model, country: name }));
      }
    });
  }

  protected onCountrySelected(name: string): void {
    this.selectedCountryCode.set(countryCodeFor(this.countryOptions(), name));
  }

  protected onCountryTyped(): void {
    this.selectedCountryCode.set(null);
  }
}
