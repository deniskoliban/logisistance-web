import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { FleetService } from '../../core/fleet/fleet.service';
import { pluralKey } from '../../core/i18n/plural.util';
import { validateDriverAge } from '../../core/utils/age.util';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import {
  countryCodeFor,
  countryName,
  filterCountries,
  localizedCountryOptions,
} from '../../core/utils/country.util';
import { formatDate } from '../../core/utils/date.util';
import { errorOf } from '../../core/utils/form-error.util';

interface ProfileModel {
  full_name: string;
  date_of_birth: string;
  /** Country name in the active language; the ISO code is tracked separately. */
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
    MatListModule,
    FormRoot,
    FormField,
    TranslocoDirective,
  ],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly fleetService = inject(FleetService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  protected readonly user = this.authService.user;
  protected readonly language = this.transloco.activeLang;

  protected readonly countryCodes = signal<string[]>([]);
  protected readonly countryOptions = computed(() =>
    localizedCountryOptions(this.countryCodes(), this.transloco.activeLang()),
  );
  protected readonly selectedCountryCode = signal<string | null>(null);

  protected readonly errorKey = signal<string | null>(null);
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly model = signal<ProfileModel>({
    full_name: this.authService.user()?.full_name ?? '',
    date_of_birth: this.authService.user()?.date_of_birth ?? '',
    country: '',
    city: this.authService.user()?.city ?? '',
  });

  protected readonly filteredCountries = computed(() =>
    filterCountries(this.countryOptions(), this.model().country),
  );

  protected readonly profileForm = form(
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
              this.authService.updateProfile({
                full_name: value.full_name,
                date_of_birth: value.date_of_birth,
                country: countryCode,
                city: value.city,
              }),
            );
            this.snackBar.open(this.transloco.translate('profile.saved'), undefined, {
              duration: 3000,
            });
          } catch (error: unknown) {
            this.serverMessage.set(
              apiErrorMessage(error, this.transloco.translate('errors.profileSaveFailed')),
            );
          }
          return undefined;
        },
      },
    },
  );

  constructor() {
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

  ngOnInit(): void {
    this.selectedCountryCode.set(this.authService.user()?.country ?? null);

    this.fleetService.countries().subscribe({
      next: (countries) => this.countryCodes.set(countries.map((country) => country.code)),
      error: () => this.errorKey.set('errors.countriesFailed'),
    });
  }

  protected onCountrySelected(name: string): void {
    this.selectedCountryCode.set(countryCodeFor(this.countryOptions(), name));
  }

  protected onCountryTyped(): void {
    this.selectedCountryCode.set(null);
  }

  protected birthDateLabel(): string {
    const isoDate = this.user()?.date_of_birth;
    return isoDate ? formatDate(isoDate, this.language()) : '—';
  }

  protected ageLabel(): string {
    const age = this.user()?.age;
    if (age === undefined) {
      return '—';
    }
    return this.transloco.translate(pluralKey('profile.years', this.language(), age), {
      count: age,
    });
  }

  protected countryLabel(code: string | undefined): string {
    if (!code) {
      return '—';
    }
    return countryName(code, this.language()) ?? code;
  }

  protected memberSince(): string {
    const createdAt = this.user()?.created_at;
    return createdAt ? formatDate(createdAt.slice(0, 10), this.language()) : '—';
  }
}
