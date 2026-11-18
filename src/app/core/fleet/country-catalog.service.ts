import { computed, inject, Injectable, signal } from '@angular/core';

import { CountryOption } from '../models';
import { countryCodeFor, sortedCountryOptions } from '../utils/country.util';
import { FleetService } from './fleet.service';

/**
 * Country reference data, loaded once.
 *
 * The names are the API's English ones on purpose — countries are not translated
 * (`utils/country.util.ts`, `DECISIONS.md` D15). Shared by the country field (options, filtering), the
 * vehicle form and the forms' validation and name → ISO code mapping, so all of them agree on one list.
 */
@Injectable({ providedIn: 'root' })
export class CountryCatalog {
  private readonly fleetService = inject(FleetService);
  private readonly loaded = signal<CountryOption[]>([]);

  /** Options in alphabetical order. */
  readonly options = computed(() => sortedCountryOptions(this.loaded()));

  constructor() {
    this.fleetService.countries().subscribe({
      next: (countries: CountryOption[]) => this.loaded.set(countries),
      error: () => this.loaded.set([]),
    });
  }

  /** Display name of one code, e.g. `PL` → "Poland"; the code itself until the list arrives. */
  nameFor(code: string): string {
    return this.options().find((option) => option.code === code)?.name ?? code;
  }

  /** ISO code for a country name, or null when the text is not one of the options. */
  codeFor(name: string): string | null {
    return countryCodeFor(this.options(), name);
  }
}
