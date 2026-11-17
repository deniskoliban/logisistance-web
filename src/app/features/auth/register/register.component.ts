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
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { validateDriverAge } from '../../../core/utils/age.util';
import { apiErrorMessage } from '../../../core/utils/api-error.util';
import { toIsoDate } from '../../../core/utils/date.util';
import { errorOf } from '../../../core/utils/form-error.util';
import { CountryFieldComponent } from '../../../shared/country-field/country-field.component';
import { FormErrorPipe } from '../../../shared/pipes/form-error.pipe';

interface RegisterModel {
  full_name: string;
  date_of_birth: Date | null;
  email: string;
  password: string;
  /** Country of residence, shown as a localised name. */
  country: string;
  /** Country where the company is registered, shown as a localised name. */
  company_country: string;
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
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  protected readonly residenceCode = signal<string | null>(null);
  protected readonly companyCode = signal<string | null>(null);

  /** Opens the calendar a plausible distance back instead of on the current month. */
  protected readonly startAt = new Date(new Date().getFullYear() - 30, 0, 1);

  protected readonly model = signal<RegisterModel>({
    full_name: '',
    date_of_birth: null,
    email: '',
    password: '',
    country: '',
    company_country: '',
    city: '',
  });

  /** Translatable error key (follows the active language). */
  protected readonly errorKey = signal<string | null>(null);
  /** Raw message from the API, kept verbatim in English. */
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly hasCountries = computed(
    () => this.residenceCode() !== null && this.companyCode() !== null,
  );

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
      validate(path.country, () =>
        this.residenceCode() ? null : { kind: 'countryUnknown' },
      );

      required(path.company_country);
      validate(path.company_country, () =>
        this.companyCode() ? null : { kind: 'countryUnknown' },
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
          const company = this.companyCode();
          const dateOfBirth = value.date_of_birth;

          if (!residence || !company || !dateOfBirth) {
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
                company_country: company,
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
