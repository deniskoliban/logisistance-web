import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { FleetService } from '../../core/fleet.service';
import { CountryOption } from '../../core/models';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly fleet = inject(FleetService);
  private readonly router = inject(Router);

  protected readonly countries = signal<CountryOption[]>([]);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    age: [null as number | null, [Validators.required, Validators.min(18), Validators.max(100)]],
    country: ['', [Validators.required]],
    city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  constructor() {
    this.fleet.countries().subscribe({
      next: (countries) => this.countries.set(countries),
      error: () => this.error.set('Could not load the country list. Is the API running?'),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .register({
        full_name: value.full_name,
        email: value.email,
        password: value.password,
        age: Number(value.age),
        country: value.country,
        city: value.city,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.router.navigate(['/vehicles']);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.set(apiErrorMessage(error, 'Could not create the account.'));
        },
      });
  }
}
