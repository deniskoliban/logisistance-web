import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
import { FleetService } from '../../core/fleet/fleet.service';
import { CountryOption } from '../../core/models';
import { apiErrorMessage } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly fleetService = inject(FleetService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly user = this.authService.user;
  protected readonly countries = signal<CountryOption[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    age: [null as number | null, [Validators.required, Validators.min(18), Validators.max(100)]],
    country: ['', [Validators.required]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  ngOnInit(): void {
    const current = this.user();
    if (current) {
      this.form.patchValue({
        full_name: current.full_name,
        age: current.age,
        country: current.country,
        city: current.city,
      });
    }

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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.authService
      .updateProfile({
        full_name: value.full_name,
        age: Number(value.age),
        country: value.country,
        city: value.city,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Profile saved.', 'Dismiss', { duration: 3000 });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(error, 'Could not save the profile.'));
        },
      });
  }
}
