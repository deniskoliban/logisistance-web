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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { CountryCatalog } from '../../core/fleet/country-catalog.service';
import { DateMaskDirective } from '../../shared/directives/date-mask.directive';
import { validateDriverAge } from '../../core/utils/age.util';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { countryName } from '../../core/utils/country.util';
import { dateInputMask, formatDate, fromIsoDate, toIsoDate } from '../../core/utils/date.util';
import { errorOf } from '../../core/utils/form-error.util';
import { CountryFieldComponent } from '../../shared/country-field/country-field.component';
import { FormErrorPipe } from '../../shared/pipes/form-error.pipe';
import { PluralPipe } from '../../shared/pipes/plural.pipe';

interface ProfileModel {
  full_name: string;
  date_of_birth: Date | null;
  /** Country of residence / default starting point, shown as a localised name. */
  country: string;
  city: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    FormRoot,
    FormField,
    TranslocoPipe,
    FormErrorPipe,
    PluralPipe,
    CountryFieldComponent,
    DateMaskDirective,
  ],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);
  private readonly countries = inject(CountryCatalog);

  protected readonly user = this.authService.user;
  protected readonly language = this.transloco.activeLang;

  protected readonly residenceCode = signal<string | null>(null);

  /** Manual-entry mask follows the date adapter's locale, so typed text stays parseable. */
  protected readonly dateMask = computed(() => dateInputMask(this.transloco.activeLang()));

  /** Where the empty calendar opens; it must follow the value or Material shows the wrong month. */
  protected readonly startAt = computed(
    () => this.model().date_of_birth ?? new Date(new Date().getFullYear() - 30, 0, 1),
  );

  protected readonly errorKey = signal<string | null>(null);
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  /** Snapshot values are derived signals, so templates never call methods. */
  protected readonly birthDateLabel = computed(() => this.formatIso(this.user()?.date_of_birth));
  protected readonly residenceLabel = computed(() => this.localiseCountry(this.user()?.country));
  protected readonly memberSince = computed(() =>
    this.formatIso(this.user()?.created_at?.slice(0, 10)),
  );

  protected readonly model = signal<ProfileModel>({
    full_name: this.authService.user()?.full_name ?? '',
    date_of_birth: fromIsoDate(this.authService.user()?.date_of_birth ?? ''),
    country: '',
    city: this.authService.user()?.city ?? '',
  });

  protected readonly profileForm = form(
    this.model,
    (path) => {
      required(path.full_name);
      minLength(path.full_name, 2);
      maxLength(path.full_name, 120);

      required(path.date_of_birth);
      validate(path.date_of_birth, ({ value }) => {
        const dateOfBirth = value();
        const issue = dateOfBirth ? validateDriverAge(toIsoDate(dateOfBirth)) : null;
        return issue ? { kind: issue } : null;
      });

      required(path.country);
      validate(path.country, ({ value }) =>
        this.countries.codeFor(value()) ? null : { kind: 'countryUnknown' },
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
          const residence = this.residenceCode();
          const dateOfBirth = value.date_of_birth;

          if (!residence || !dateOfBirth) {
            this.errorKey.set('errors.countryUnknown');
            return undefined;
          }

          try {
            await firstValueFrom(
              this.authService.updateProfile({
                full_name: value.full_name,
                date_of_birth: toIsoDate(dateOfBirth),
                country: residence,
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

  ngOnInit(): void {
    this.residenceCode.set(this.authService.user()?.country ?? null);
  }

  private formatIso(isoDate: string | undefined): string {
    return isoDate ? formatDate(isoDate, this.language()) : '—';
  }

  private localiseCountry(code: string | undefined): string {
    if (!code) {
      return '—';
    }
    return countryName(code, this.language()) ?? code;
  }
}
