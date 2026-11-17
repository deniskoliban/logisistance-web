import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  max,
  maxLength,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { FleetService } from '../../../core/fleet/fleet.service';
import { CountryOption } from '../../../core/models';
import { apiErrorMessage } from '../../../core/utils/api-error.util';
import { errorOf } from '../../../core/utils/form-error.util';

interface RegisterModel {
  full_name: string;
  email: string;
  password: string;
  age: number | null;
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
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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
  protected readonly error = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly model = signal<RegisterModel>({
    full_name: '',
    email: '',
    password: '',
    age: null,
    country: '',
    city: '',
  });

  protected readonly registerForm = form(
    this.model,
    (path) => {
      required(path.full_name, { message: 'Full name is required' });
      minLength(path.full_name, 2, { message: 'At least 2 characters' });
      maxLength(path.full_name, 120, { message: 'Up to 120 characters' });

      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });

      required(path.password, { message: 'Password is required' });
      minLength(path.password, 8, { message: 'Use at least 8 characters' });
      maxLength(path.password, 128, { message: 'Up to 128 characters' });

      required(path.age, { message: 'Age is required' });
      min(path.age, 18, { message: 'Drivers must be at least 18' });
      max(path.age, 100, { message: 'Drivers must be at most 100' });

      required(path.country, { message: 'Select your country' });

      required(path.city, { message: 'City is required' });
      minLength(path.city, 2, { message: 'At least 2 characters' });
      maxLength(path.city, 120, { message: 'Up to 120 characters' });
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          this.error.set(null);
          const value = this.model();
          try {
            await firstValueFrom(
              this.authService.register({
                full_name: value.full_name,
                email: value.email,
                password: value.password,
                age: Number(value.age),
                country: value.country,
                city: value.city,
              }),
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
