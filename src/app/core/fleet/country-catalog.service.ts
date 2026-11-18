import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { CountryOption } from '../models';
import { countryCodeFor, countryLabel, localizedCountryOptions } from '../utils/country.util';
import { FleetService } from './fleet.service';

/**
 * Country reference data in the active language, loaded once.
 *
 * Shared by the country field (options, filtering), the vehicle form and the forms' validation and
 * name → ISO code mapping, so all of them agree on one list and one set of names.
 */
@Injectable({ providedIn: 'root' })
export class CountryCatalog {
  private readonly fleetService = inject(FleetService);
  private readonly transloco = inject(TranslocoService);
  private readonly codes = signal<string[]>([]);

  /** Localised options, re-sorted for the active language. */
  readonly options = computed(() =>
    localizedCountryOptions(
      this.codes(),
      (key, params) => this.transloco.translate(key, params),
      this.transloco.activeLang(),
    ),
  );

  constructor() {
    this.fleetService.countries().subscribe({
      next: (countries: CountryOption[]) => this.codes.set(countries.map((c) => c.code)),
      error: () => this.codes.set([]),
    });
  }

  /** Localised name of one code, e.g. `PL` → "Poland" / "Польша". */
  nameFor(code: string): string {
    return countryLabel(
      code,
      (key, params) => this.transloco.translate(key, params),
      this.transloco.activeLang(),
    );
  }

  /** ISO code for a localised country name, or null when the text is not one of the options. */
  codeFor(name: string): string | null {
    return countryCodeFor(this.options(), name);
  }
}
