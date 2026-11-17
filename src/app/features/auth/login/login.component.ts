import { Component, effect, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error.util';
import { errorOf } from '../../../core/utils/form-error.util';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FormRoot,
    FormField,
    TranslocoDirective,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);

  protected readonly model = signal<LoginModel>({ email: '', password: '' });
  protected readonly serverMessage = signal<string | null>(null);
  protected readonly errorOf = errorOf;

  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email);
      email(path.email);
      required(path.password);
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          this.serverMessage.set(null);
          try {
            await firstValueFrom(this.authService.login(this.model()));
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/vehicles';
            await this.router.navigateByUrl(returnUrl);
          } catch (error: unknown) {
            this.serverMessage.set(
              apiErrorMessage(error, this.transloco.translate('errors.signInFailed')),
            );
          }
          return undefined;
        },
      },
    },
  );

  constructor() {
    // A message captured in one language should not linger after switching to another.
    effect(() => {
      this.transloco.activeLang();
      this.serverMessage.set(null);
    });
  }
}
