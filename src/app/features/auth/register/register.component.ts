import { Component, computed, inject, signal } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { FleetService } from '../../../core/fleet/fleet.service';
import { CountryOption } from '../../../core/models';
import { validateDriverAge } from '../../../core/utils/age.util';
import { apiErrorMessage } from '../../../core/utils/api-error.util';
import { countryCodeFor, filterCountries } from '../../../core/utils/country.util';
import { errorOf } from '../../../core/utils/form-error.util';

interface RegisterModel {
  full_name: string;
  date_of_birth: string;
  email: string;
  password: string;
  /** Country *name*, mapped to its ISO code on submit. */
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
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly fleetService = inject(FleetService);
  private readonly router = inject(Router);

  protected readonly countries = signal<CountryOption[]>([]);

  protected readonly model = signal<RegisterModel>({
    full_name: '',
    date_of_birth: '',
    email: '',
    password: '',
    country: '',
    city: '',
  });

  protected readonly error = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly filteredCountries = computed(() =>
    filterCountries(this.countries(), this.model().country),
  );

  protected readonly registerForm = form(
    this.model,
    (path) => {
      required(path.full_name, { message: 'Full name is required' });
      minLength(path.full_name, 2, { message: 'At least 2 characters' });
      maxLength(path.full_name, 120, { message: 'Up to 120 characters' });

      required(path.date_of_birth, { message: 'Date of birth is required' });
      validate(path.date_of_birth, ({ value }) => {
        const message = validateDriverAge(value());
        return message ? { kind: 'driverAge', message } : null;
      });

      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });

      required(path.password, { message: 'Password is required' });
      minLength(path.password, 8, { message: 'Use at least 8 characters' });
      maxLength(path.password, 128, { message: 'Up to 128 characters' });

      required(path.country, { message: 'Country is required' });
      validate(path.country, ({ value }) =>
        countryCodeFor(this.countries(), value())
          ? null
          : { kind: 'country', message: 'Pick a country from the list' },
      );

      required(path.city, { message: 'City is required' });
      minLength(path.city, 2, { message: 'At least 2 characters' });
      maxLength(path.city, 120, { message: 'Up to 120 characters' });
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          this.error.set(null);
          const value = this.model();
          const countryCode = countryCodeFor(this.countries(), value.country);
          if (!countryCode) {
            this.error.set('Pick a country from the list.');
            return undefined;
          }

          try {
            await firstValueFrom(
              this.authService.register({ ...value, country: countryCode }),
            );
            await this.router.navigate(['/vehicles']);
          } catch (error: unknown) {
            this.error.set(apiErrorMessage(error, 'Could not create the account.'));
          }
          return undefined;
        },
      },
    },
  );

  constructor() {
    this.fleetService.countries().subscribe({
      next: (countries) => this.countries.set(countries),
      error: () => this.error.set('Could not load the country list. Is the API running?'),
    });
  }
}
