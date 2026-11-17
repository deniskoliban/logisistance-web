import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
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
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { FleetService } from '../../core/fleet/fleet.service';
import { CountryOption } from '../../core/models';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { errorOf } from '../../core/utils/form-error.util';

interface ProfileModel {
  full_name: string;
  age: number | null;
  country: string;
  city: string;
}

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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

  protected readonly model = signal<ProfileModel>(this.currentProfile());

  protected readonly profileForm = form(
    this.model,
    (path) => {
      required(path.full_name, { message: 'Full name is required' });
      minLength(path.full_name, 2, { message: 'At least 2 characters' });
      maxLength(path.full_name, 120, { message: 'Up to 120 characters' });

      required(path.age, { message: 'Age is required' });
      min(path.age, 18, { message: 'Between 18 and 100' });
      max(path.age, 100, { message: 'Between 18 and 100' });

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
              this.authService.updateProfile({
                full_name: value.full_name,
                age: Number(value.age),
                country: value.country,
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
      next: (countries) => this.countries.set(countries),
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

  private currentProfile(): ProfileModel {
    const current = this.authService.user();
    return {
      full_name: current?.full_name ?? '',
      age: current?.age ?? null,
      country: current?.country ?? '',
      city: current?.city ?? '',
    };
  }
}
