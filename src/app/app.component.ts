import { Component, effect, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { AuthService } from './core/auth/auth.service';
import { SUPPORTED_LANGUAGES } from './core/i18n/languages';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);
  private readonly dateAdapter = inject(DateAdapter);

  protected readonly user = this.authService.user;
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isDark = this.themeService.isDark;
  protected readonly language = this.languageService.active;
  protected readonly languages = SUPPORTED_LANGUAGES;

  constructor() {
    // The Material date picker formats and parses with the adapter locale, so keep it in step.
    effect(() => {
      const language = this.languageService.active();
      this.dateAdapter.setLocale(language);
    });
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected setLanguage(language: string): void {
    this.languageService.use(language);
  }

  protected logout(): void {
    this.authService.logout();
  }
}
