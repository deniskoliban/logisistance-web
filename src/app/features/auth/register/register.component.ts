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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DateMaskDirective } from '../../../shared/directives/date-mask.directive';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { CountryCatalog } from '../../../core/fleet/country-catalog.service';
import { validateDriverAge } from '../../../core/utils/age.util';
import { apiErrorMessage } from '../../../core/utils/api-error.util';
import { dateInputMask, toIsoDate } from '../../../core/utils/date.util';
import { errorOf } from '../../../core/utils/form-error.util';
import { CountryFieldComponent } from '../../../shared/country-field/country-field.component';
import { FormErrorPipe } from '../../../shared/pipes/form-error.pipe';

interface RegisterModel {
  full_name: string;
  date_of_birth: Date | null;
  email: string;
  password: string;
  /** Country of residence / default starting point, shown as a localised name. */
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
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    FormRoot,
    FormField,
    TranslocoPipe,
    FormErrorPipe,
    CountryFieldComponent,
    DateMaskDirective,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly countries = inject(CountryCatalog);

  protected readonly residenceCode = signal<string | null>(null);

  /** Manual-entry mask follows the date adapter's locale, so typed text stays parseable. */
  protected readonly dateMask = computed(() => dateInputMask(this.transloco.activeLang()));

  /**
   * Where the empty calendar opens. `startAt` must follow the current value, otherwise Material
   * shows the start month instead of the selected date (the typed date would look "lost").
   */
  protected readonly startAt = computed(
    () => this.model().date_of_birth ?? new Date(new Date().getFullYear() - 30, 0, 1),
  );

  protected readonly model = signal<RegisterModel>({
    full_name: '',
    date_of_birth: null,
    email: '',
    password: '',
    country: '',
    city: '',
  });

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
        const dateOfBirth = value();
        const issue = dateOfBirth ? validateDriverAge(toIsoDate(dateOfBirth)) : null;
        return issue ? { kind: issue } : null;
      });

      required(path.email);
      email(path.email);

      required(path.password);
      minLength(path.password, 8);
      maxLength(path.password, 128);

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
              this.authService.register({
                full_name: value.full_name,
                email: value.email,
                password: value.password,
                date_of_birth: toIsoDate(dateOfBirth),
                country: residence,
                city: value.city,
              }),
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
}
