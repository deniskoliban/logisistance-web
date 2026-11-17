import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { FleetService } from '../../core/fleet.service';
import { CountryOption } from '../../core/models';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly fleet = inject(FleetService);

  protected readonly user = this.auth.user;
  protected readonly countries = signal<CountryOption[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saved = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    age: [null as number | null, [Validators.required, Validators.min(18), Validators.max(100)]],
    country: ['', [Validators.required]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  ngOnInit(): void {
    const user = this.user();
    if (user) {
      this.form.patchValue({
        full_name: user.full_name,
        age: user.age,
        country: user.country,
        city: user.city,
      });
    }
    this.fleet.countries().subscribe({
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
    this.saved.set(false);

    this.auth
      .updateProfile({
        full_name: value.full_name,
        age: Number(value.age),
        country: value.country,
        city: value.city,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.set(true);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(apiErrorMessage(error, 'Could not save the profile.'));
        },
      });
  }
}
