import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { CountryOption } from '../models';
import { countryCodeFor, localizedCountryOptions } from '../utils/country.util';
import { FleetService } from './fleet.service';

/**
 * Country reference data in the active language, loaded once.
 *
 * Shared by the country field (options, filtering) and by the forms (validation and the
 * name → ISO code mapping on submit), so all three agree on the same list.
 */
@Injectable({ providedIn: 'root' })
export class CountryCatalog {
  private readonly fleetService = inject(FleetService);
  private readonly transloco = inject(TranslocoService);
  private readonly codes = signal<string[]>([]);

  /** Localised options, re-sorted for the active language. */
  readonly options = computed(() =>
    localizedCountryOptions(this.codes(), this.transloco.activeLang()),
  );

  constructor() {
    this.fleetService.countries().subscribe({
      next: (countries: CountryOption[]) => this.codes.set(countries.map((c) => c.code)),
      error: () => this.codes.set([]),
    });
  }

  /** ISO code for a localised country name, or null when the text is not one of the options. */
  codeFor(name: string): string | null {
    return countryCodeFor(this.options(), name);
  }
}
