import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
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
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { FleetService } from '../../core/fleet/fleet.service';
import { CountryOption } from '../../core/models';
import { validateDriverAge } from '../../core/utils/age.util';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { countryCodeFor, filterCountries } from '../../core/utils/country.util';
import { errorOf } from '../../core/utils/form-error.util';

interface ProfileModel {
  full_name: string;
  date_of_birth: string;
  /** Country *name*; the stored code is resolved on load and back on save. */
  country: string;
  city: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    FormRoot,
    FormField,
  ],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fleetService = inject(FleetService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly user = this.authService.user;
  protected readonly countries = signal<CountryOption[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly model = signal<ProfileModel>({
    full_name: this.authService.user()?.full_name ?? '',
    date_of_birth: this.authService.user()?.date_of_birth ?? '',
    country: '',
    city: this.authService.user()?.city ?? '',
  });

  protected readonly filteredCountries = computed(() =>
    filterCountries(this.countries(), this.model().country),
  );

  protected readonly profileForm = form(
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
              this.authService.updateProfile({
                full_name: value.full_name,
                date_of_birth: value.date_of_birth,
                country: countryCode,
                city: value.city,
              }),
            );
            this.snackBar.open('Profile saved.', 'Dismiss', { duration: 3000 });
          } catch (error: unknown) {
            this.error.set(apiErrorMessage(error, 'Could not save the profile.'));
          }
          return undefined;
        },
      },
    },
  );

  ngOnInit(): void {
    this.fleetService.countries().subscribe({
      next: (countries) => {
        this.countries.set(countries);
        // The profile stores an ISO code; the field shows the readable name.
        const code = this.authService.user()?.country;
        const name = countries.find((country) => country.code === code)?.name;
        if (name) {
          this.model.update((model) => ({ ...model, country: name }));
        }
      },
      error: () => this.error.set('Could not load the country list.'),
    });
  }

  protected memberSince(): string {
    const createdAt = this.user()?.created_at;
    return createdAt ? createdAt.slice(0, 10) : '—';
  }

  protected countryName(code: string | undefined): string {
    if (!code) {
      return '—';
    }
    return this.countries().find((country) => country.code === code)?.name ?? code;
  }
}
